package websocket

import (
	"errors"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/security"
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

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find the endpoint associated to the stack inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find the endpoint associated to the stack inside the database", err}
	}

	cli, err := handler.KubernetesClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create Kubernetes client", err}
	}

	permissionDeniedErr := "Permission denied to access endpoint"
	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
	}

	if tokenData.Role != portainer.AdministratorRole {
		// check if the user has console RW access in the endpoint
		endpointRole, err := handler.authorizationService.GetUserEndpointRole(int(tokenData.ID), int(endpoint.ID))
		if err != nil {
			return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
		} else if !endpointRole.Authorizations[portainer.OperationK8sApplicationConsoleRW] {
			err = errors.New(permissionDeniedErr)
			return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
		}
		// will skip if user can access all namespaces
		if !endpointRole.Authorizations[portainer.OperationK8sAccessAllNamespaces] {
			// check if the user has RW access to the namespace
			namespaceAuthorizations, err := handler.authorizationService.GetNamespaceAuthorizations(int(tokenData.ID), *endpoint, cli)
			log.Printf("[DEBUG][RBAC] %d has namespace authorizations %+v @ %d, %s", int(tokenData.ID), namespaceAuthorizations, int(endpoint.ID), namespace)
			if err != nil {
				return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
			} else if auth, ok := namespaceAuthorizations[namespace]; !ok || !auth[portainer.OperationK8sAccessNamespaceWrite] {
				err = errors.New(permissionDeniedErr)
				return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
			}
		}
	}

	params := &webSocketRequestParams{
		endpoint: endpoint,
	}

	r.Header.Del("Origin")

	if endpoint.Type == portainer.AgentOnKubernetesEnvironment {
		err := handler.proxyAgentWebsocketRequest(w, r, params)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to proxy websocket request to agent", err}
		}
		return nil
	} else if endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment {
		err := handler.proxyEdgeAgentWebsocketRequest(w, r, params)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to proxy websocket request to Edge agent", err}
		}
		return nil
	}

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
