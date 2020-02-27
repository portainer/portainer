package websocket

import (
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
)

// websocketPodExec handles GET requests on /websocket/pod?token=<token>&endpointId=<endpointID>&namespace=<namespace>&podName=<podName>&containerName=<containerName>&command=<command>
// The request will be upgraded to the websocket protocol.
// Authentication and access is controlled via the mandatory token query parameter.
// The following parameters query parameters are mandatory:
// * token: JWT token used for authentication against this endpoint
// * endpointId: endpoint ID of the endpoint where the resource is located
// * namespace: namespace where the container is located
// * podName: name of the pod containing the container
// * containerName: name of the container
// * command: command to execute in the container
func (handler *Handler) websocketPodExec(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: endpointId", err}
	}

	namespace, err := request.RetrieveQueryParameter(r, "namespace", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: namespace", err}
	}

	podName, err := request.RetrieveQueryParameter(r, "podName", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: podName", err}
	}

	containerName, err := request.RetrieveQueryParameter(r, "containerName", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: containerName", err}
	}

	command, err := request.RetrieveQueryParameter(r, "command", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: command", err}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find the endpoint associated to the stack inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find the endpoint associated to the stack inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint, false)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
	}

	// TODO:
	// if endpoint.Type === kubernetes local, proceed
	// else if Edge/Agent, proxy

	commandArray := strings.Split(command, " ")

	websocketConn, err := handler.connectionUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to upgrade the connection", err}
	}
	defer websocketConn.Close()

	stdinReader, stdinWriter := io.Pipe()
	defer stdinWriter.Close()
	stdoutReader, stdoutWriter := io.Pipe()
	defer stdoutWriter.Close()

	errorChan := make(chan error, 1)
	go streamFromWebsocketToWriter(websocketConn, stdinWriter, errorChan)
	go streamFromReaderToWebsocket(websocketConn, stdoutReader, errorChan)

	cli, err := handler.KubernetesClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create Kubernetes client", err}
	}

	err = cli.StartExecProcess(namespace, podName, containerName, commandArray, stdinReader, stdoutWriter)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to start exec process inside container", err}
	}

	err = <-errorChan
	if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
		log.Printf("websocket error: %s \n", err.Error())
	}

	return nil
}
