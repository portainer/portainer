package handler

import (
	"bufio"
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/koding/websocketproxy"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/crypto"
	httperror "github.com/portainer/portainer/http/error"
)

type (
	// WebSocketHandler represents an HTTP API handler for proxying requests to a web socket.
	WebSocketHandler struct {
		*mux.Router
		Logger             *log.Logger
		EndpointService    portainer.EndpointService
		SignatureService   portainer.DigitalSignatureService
		connectionUpgrader websocket.Upgrader
	}

	webSocketExecRequestParams struct {
		execID   string
		nodeName string
		endpoint *portainer.Endpoint
	}

	execStartOperationPayload struct {
		Tty    bool
		Detach bool
	}
)

// NewWebSocketHandler returns a new instance of WebSocketHandler.
func NewWebSocketHandler() *WebSocketHandler {
	h := &WebSocketHandler{
		Router:             mux.NewRouter(),
		Logger:             log.New(os.Stderr, "", log.LstdFlags),
		connectionUpgrader: websocket.Upgrader{},
	}
	h.HandleFunc("/websocket/exec", h.handleWebsocketExec).Methods(http.MethodGet)
	return h
}

// handleWebsocketExec handles GET requests on /websocket/exec?id=<execID>&endpointId=<endpointID>&nodeName=<nodeName>
// If the nodeName query parameter is present, the request will be proxied to the underlying agent endpoint.
// If the nodeName query parameter is not specified, the request will be upgraded to the websocket protocol and
// an ExecStart operation HTTP request will be created and hijacked.
func (handler *WebSocketHandler) handleWebsocketExec(w http.ResponseWriter, r *http.Request) {
	paramExecID := r.FormValue("id")
	paramEndpointID := r.FormValue("endpointId")
	if paramExecID == "" || paramEndpointID == "" {
		httperror.WriteErrorResponse(w, httperror.ErrInvalidQueryFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	endpointID, err := strconv.Atoi(paramEndpointID)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	params := &webSocketExecRequestParams{
		endpoint: endpoint,
		execID:   paramExecID,
		nodeName: r.FormValue("nodeName"),
	}

	err = handler.handleRequest(w, r, params)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

func (handler *WebSocketHandler) handleRequest(w http.ResponseWriter, r *http.Request, params *webSocketExecRequestParams) error {
	r.Header.Del("Origin")

	if params.nodeName != "" {
		return handler.proxyWebsocketRequest(w, r, params)
	}

	websocketConn, err := handler.connectionUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return err
	}
	defer websocketConn.Close()

	return hijackExecStartOperation(websocketConn, params.endpoint, params.execID)
}

func (handler *WebSocketHandler) proxyWebsocketRequest(w http.ResponseWriter, r *http.Request, params *webSocketExecRequestParams) error {
	agentURL, err := url.Parse(params.endpoint.URL)
	if err != nil {
		return err
	}

	agentURL.Scheme = "ws"
	proxy := websocketproxy.NewProxy(agentURL)

	if params.endpoint.TLSConfig.TLS || params.endpoint.TLSConfig.TLSSkipVerify {
		agentURL.Scheme = "wss"
		proxy.Dialer = &websocket.Dialer{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: params.endpoint.TLSConfig.TLSSkipVerify,
			},
		}
	}

	signature, err := handler.SignatureService.Sign(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return err
	}

	proxy.Director = func(incoming *http.Request, out http.Header) {
		out.Set(portainer.PortainerAgentSignatureHeader, signature)
		out.Set(portainer.PortainerAgentTargetHeader, params.nodeName)
	}

	proxy.ServeHTTP(w, r)

	return nil
}

func hijackExecStartOperation(websocketConn *websocket.Conn, endpoint *portainer.Endpoint, execID string) error {
	dial, err := createDial(endpoint)
	if err != nil {
		return err
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

	httpConn := httputil.NewClientConn(dial, nil)
	defer httpConn.Close()

	execStartRequest, err := createExecStartRequest(execID)
	if err != nil {
		return err
	}

	err = hijackRequest(websocketConn, httpConn, execStartRequest)
	if err != nil {
		return err
	}

	return nil
}

func createDial(endpoint *portainer.Endpoint) (net.Conn, error) {
	url, err := url.Parse(endpoint.URL)
	if err != nil {
		return nil, err
	}

	var host string
	if url.Scheme == "tcp" {
		host = url.Host
	} else if url.Scheme == "unix" {
		host = url.Path
	}

	if endpoint.TLSConfig.TLS {
		tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig.TLSCACertPath, endpoint.TLSConfig.TLSCertPath, endpoint.TLSConfig.TLSKeyPath, endpoint.TLSConfig.TLSSkipVerify)
		if err != nil {
			return nil, err
		}
		return tls.Dial(url.Scheme, host, tlsConfig)
	}

	return net.Dial(url.Scheme, host)
}

func createExecStartRequest(execID string) (*http.Request, error) {
	execStartOperationPayload := &execStartOperationPayload{
		Tty:    true,
		Detach: false,
	}

	encodedBody := bytes.NewBuffer(nil)
	err := json.NewEncoder(encodedBody).Encode(execStartOperationPayload)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest("POST", "/exec/"+execID+"/start", encodedBody)
	if err != nil {
		return nil, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Connection", "Upgrade")
	request.Header.Set("Upgrade", "tcp")

	return request, nil
}

func hijackRequest(websocketConn *websocket.Conn, httpConn *httputil.ClientConn, request *http.Request) error {
	// Server hijacks the connection, error 'connection closed' expected
	resp, err := httpConn.Do(request)
	if err != httputil.ErrPersistEOF {
		if err != nil {
			return err
		}
		if resp.StatusCode != http.StatusSwitchingProtocols {
			resp.Body.Close()
			return fmt.Errorf("unable to upgrade to tcp, received %d", resp.StatusCode)
		}
	}

	tcpConn, brw := httpConn.Hijack()
	defer tcpConn.Close()

	errorChan := make(chan error, 1)
	go streamFromTCPConnToWebsocketConn(websocketConn, brw, errorChan)
	go streamFromWebsocketConnToTCPConn(websocketConn, tcpConn, errorChan)

	err = <-errorChan
	if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
		return err
	}

	return nil
}

func streamFromWebsocketConnToTCPConn(websocketConn *websocket.Conn, tcpConn net.Conn, errorChan chan error) {
	for {
		_, in, err := websocketConn.ReadMessage()
		if err != nil {
			errorChan <- err
			break
		}

		_, err = tcpConn.Write(in)
		if err != nil {
			errorChan <- err
			break
		}
	}
}

func streamFromTCPConnToWebsocketConn(websocketConn *websocket.Conn, br *bufio.Reader, errorChan chan error) {
	for {
		out := make([]byte, 1024)
		_, err := br.Read(out)
		if err != nil {
			errorChan <- err
			break
		}

		err = websocketConn.WriteMessage(websocket.TextMessage, out)
		if err != nil {
			errorChan <- err
			break
		}
	}
}
