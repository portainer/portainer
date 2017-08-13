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

func (handler *WebSocketHandler) webSocketDockerExec(ws *websocket.Conn) {
	qry := ws.Request().URL.Query()
	execID := qry.Get("id")
	edpID := qry.Get("endpointId")

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

	endpointURL, err := url.Parse(endpoint.URL)
	if err != nil {
		log.Printf("Unable to parse endpoint URL: %s", err)
		return
	}

	var host string
	if endpointURL.Scheme == "tcp" {
		host = endpointURL.Host
	} else if endpointURL.Scheme == "unix" {
		host = endpointURL.Path
	}

	// Should not be managed here
	var tlsConfig *tls.Config
	if endpoint.TLS {
		tlsConfig, err = crypto.CreateTLSConfiguration(endpoint.TLSCACertPath, endpoint.TLSCertPath, endpoint.TLSKeyPath, false)
		if err != nil {
			log.Fatalf("Unable to create TLS configuration: %s", err)
			return
		}
	}

	if err := hijack(host, endpointURL.Scheme, "POST", "/exec/"+execID+"/start", tlsConfig, true, ws, ws, ws, nil, nil); err != nil {
		log.Fatalf("error during hijack: %s", err)
		return
	}
}

type execConfig struct {
	Tty    bool
	Detach bool
}

// hijack allows to upgrade an HTTP connection to a TCP connection
// It redirects IO streams for stdin, stdout and stderr to a websocket
func hijack(addr, scheme, method, path string, tlsConfig *tls.Config, setRawTerminal bool, in io.ReadCloser, stdout, stderr io.Writer, started chan io.Closer, data interface{}) error {
	execConfig := &execConfig{
		Tty:    true,
		Detach: false,
	}

	buf, err := json.Marshal(execConfig)
	if err != nil {
		return fmt.Errorf("error marshaling exec config: %s", err)
	}

	rdr := bytes.NewReader(buf)

	req, err := http.NewRequest(method, path, rdr)
	if err != nil {
		return fmt.Errorf("error during hijack request: %s", err)
	}

	req.Header.Set("User-Agent", "Docker-Client")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Connection", "Upgrade")
	req.Header.Set("Upgrade", "tcp")
	req.Host = addr

	var (
		dial    net.Conn
		dialErr error
	)

	if tlsConfig == nil {
		dial, dialErr = net.Dial(scheme, addr)
	} else {
		dial, dialErr = tls.Dial(scheme, addr, tlsConfig)
	}

	if dialErr != nil {
		return dialErr
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
	if err != nil {
		return err
	}
	clientconn := httputil.NewClientConn(dial, nil)
	defer clientconn.Close()

	// Server hijacks the connection, error 'connection closed' expected
	clientconn.Do(req)

	rwc, br := clientconn.Hijack()
	defer rwc.Close()

	if started != nil {
		started <- rwc
	}

	var receiveStdout chan error

	if stdout != nil || stderr != nil {
		go func() (err error) {
			if setRawTerminal && stdout != nil {
				_, err = io.Copy(stdout, br)
			}
			return err
		}()
	}

	go func() error {
		if in != nil {
			io.Copy(rwc, in)
		}

		if conn, ok := rwc.(interface {
			CloseWrite() error
		}); ok {
			if err := conn.CloseWrite(); err != nil {
			}
		}
		return nil
	}()

	if stdout != nil || stderr != nil {
		if err := <-receiveStdout; err != nil {
			return err
		}
	}
	go func() {
		for {
			fmt.Println(br)
		}
	}()

	return nil
}
