package handler

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/crypto"
	"golang.org/x/net/websocket"
)

// WebSocketHandler represents an HTTP API handler for proxying requests to a web socket.
type WebSocketHandler struct {
	*mux.Router
	Logger          *log.Logger
	EndpointService portainer.EndpointService
}

// NewWebSocketHandler returns a new instance of WebSocketHandler.
func NewWebSocketHandler() *WebSocketHandler {
	h := &WebSocketHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/websocket/exec", websocket.Handler(h.webSocketDockerExec))
	return h
}

type (
	httpTarget struct {
		host      string
		scheme    string
		tlsConfig *tls.Config
	}

	execStartOperationPayload struct {
		Tty    bool
		Detach bool
	}

	hijackedStream struct {
		in  io.ReadCloser
		out io.Writer
	}
)

func createHTTPTargetFromEndpoint(endpoint *portainer.Endpoint) (*httpTarget, error) {
	url, err := url.Parse(endpoint.URL)
	if err != nil {
		return nil, err
	}

	target := httpTarget{
		scheme: url.Scheme,
	}

	if url.Scheme == "tcp" {
		target.host = url.Host
	} else if url.Scheme == "unix" {
		target.host = url.Path
	}

	if endpoint.TLSConfig.TLS {
		tlsConfig, err := crypto.CreateTLSConfiguration(&endpoint.TLSConfig)
		if err != nil {
			return nil, err
		}
		target.tlsConfig = tlsConfig
	}

	return &target, nil
}

func prepareRequest(method, path, host string) (*http.Request, error) {
	execStartOperationPayload := &execStartOperationPayload{
		Tty:    true,
		Detach: false,
	}

	encodedBody := bytes.NewBuffer(nil)
	err := json.NewEncoder(encodedBody).Encode(execStartOperationPayload)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest(method, path, encodedBody)
	if err != nil {
		return nil, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Connection", "Upgrade")
	request.Header.Set("Upgrade", "tcp")
	request.Header.Set("User-Agent", "Docker-Client")
	request.Host = host

	return request, nil
}

func prepareDial(target *httpTarget) (net.Conn, error) {
	if target.tlsConfig != nil {
		return tls.Dial(target.scheme, target.host, target.tlsConfig)
	}
	return net.Dial(target.scheme, target.host)
}

func doHijack(dial net.Conn, request *http.Request, stream hijackedStream) error {
	clientconn := httputil.NewClientConn(dial, nil)
	defer clientconn.Close()

	// Server hijacks the connection, error 'connection closed' expected
	resp, err := clientconn.Do(request)
	if err != httputil.ErrPersistEOF {
		if err != nil {
			return err
		}
		if resp.StatusCode != http.StatusSwitchingProtocols {
			resp.Body.Close()
			return fmt.Errorf("unable to upgrade to tcp, received %d", resp.StatusCode)
		}
	}

	c, br := clientconn.Hijack()
	defer c.Close()

	go func() error {
		_, err = io.Copy(stream.out, br)
		return err
	}()

	go func() error {
		_, err = io.Copy(c, stream.in)
		return err
	}()

	var receiveStdout chan error
	if err := <-receiveStdout; err != nil {
		return err
	}

	return nil
}

func (handler *WebSocketHandler) webSocketDockerExec(ws *websocket.Conn) {
	qry := ws.Request().URL.Query()
	execID := qry.Get("id")
	edpID := qry.Get("endpointId")
	if execID == "" || edpID == "" {
		log.Printf("Invalid query parameters")
		return
	}

	parsedID, err := strconv.Atoi(edpID)
	if err != nil {
		log.Printf("Unable to parse endpoint ID: %s", err)
		return
	}

	endpointID := portainer.EndpointID(parsedID)
	endpoint, err := handler.EndpointService.Endpoint(endpointID)
	if err != nil {
		log.Printf("Unable to retrieve endpoint: %s", err)
		return
	}

	target, err := createHTTPTargetFromEndpoint(endpoint)
	if err != nil {
		log.Printf("Unable to retrieve endpoint: %s", err)
		return
	}

	request, err := prepareRequest("POST", "/exec/"+execID+"/start", target.host)
	if err != nil {
		log.Printf("Unable to create request: %s", err)
		return
	}

	dial, err := prepareDial(target)
	if err != nil {
		log.Printf("Unable to create dial: %s", err)
		return
	}

	// When we set up a TCP connection for hijack, there could be long periods
	// of inactivity (a long running command with no output) that in certain
	// network setups may cause ECONNTIMEOUT, leaving the client in an unknown
	// state. Setting TCP KeepAlive on the socket connection will prohibit
	// ECONNTIMEOUT unless the socket connection truly is broken
	if tcpConn, ok := dial.(*net.TCPConn); ok {
		tcpConn.SetKeepAlive(true)
		tcpConn.SetKeepAlivePeriod(30 * time.Second)
	}

	stream := hijackedStream{
		in:  ws,
		out: ws,
	}

	err = doHijack(dial, request, stream)
	if err != nil {
		log.Printf("Hijack failed: %s", err)
		return
	}
}
