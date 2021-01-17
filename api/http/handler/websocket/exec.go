package websocket

import (
	"bytes"
	"encoding/json"
	"net"
	"net/http"
	"net/http/httputil"
	"time"

	"github.com/portainer/portainer/api/bolt/errors"

	"github.com/asaskevich/govalidator"
	"github.com/gorilla/websocket"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
)

type execStartOperationPayload struct {
	Tty    bool
	Detach bool
}

// @summary Execute a websocket
// @description If the nodeName query parameter is present, the request will be proxied to the underlying agent endpoint.
// @description If the nodeName query parameter is not specified, the request will be upgraded to the websocket protocol and
// @description an ExecStart operation HTTP request will be created and hijacked.
// @description Authentication and access is controlled via the mandatory token query parameter.
// @security jwt
// @tags websocket
// @accept json
// @produce json
// @param endpointId query int true "endpoint ID of the endpoint where the resource is located"
// @param nodeName query string false "node name"
// @param token query string true "JWT token used for authentication against this endpoint"
// @success 200
// @failure 400,409,500
// @router /websocket/exec [get]
func (handler *Handler) websocketExec(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	execID, err := request.RetrieveQueryParameter(r, "id", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: id", err}
	}
	if !govalidator.IsHexadecimal(execID) {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: id (must be hexadecimal identifier)", err}
	}

	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: endpointId", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find the endpoint associated to the stack inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find the endpoint associated to the stack inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
	}

	params := &webSocketRequestParams{
		endpoint: endpoint,
		ID:       execID,
		nodeName: r.FormValue("nodeName"),
	}

	err = handler.handleExecRequest(w, r, params)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "An error occured during websocket exec operation", err}
	}

	return nil
}

func (handler *Handler) handleExecRequest(w http.ResponseWriter, r *http.Request, params *webSocketRequestParams) error {
	r.Header.Del("Origin")

	if params.endpoint.Type == portainer.AgentOnDockerEnvironment {
		return handler.proxyAgentWebsocketRequest(w, r, params)
	} else if params.endpoint.Type == portainer.EdgeAgentOnDockerEnvironment {
		return handler.proxyEdgeAgentWebsocketRequest(w, r, params)
	}

	websocketConn, err := handler.connectionUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return err
	}
	defer websocketConn.Close()

	return hijackExecStartOperation(websocketConn, params.endpoint, params.ID)
}

func hijackExecStartOperation(websocketConn *websocket.Conn, endpoint *portainer.Endpoint, execID string) error {
	dial, err := initDial(endpoint)
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
