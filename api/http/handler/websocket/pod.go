package websocket

import (
	"github.com/portainer/portainer/api/http/security"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"
)

// @summary Execute a websocket on pod
// @description The request will be upgraded to the websocket protocol.
// @description Authentication and access is controlled via the mandatory token query parameter.
// @security jwt
// @tags websocket
// @accept json
// @produce json
// @param endpointId query int true "endpoint ID of the endpoint where the resource is located"
// @param namespace query string true "namespace where the container is located"
// @param podName query string true "name of the pod containing the container"
// @param containerName query string true "name of the container"
// @param command query string true "command to execute in the container"
// @param token query string true "JWT token used for authentication against this endpoint"
// @success 200
// @failure 400
// @failure 403
// @failure 404
// @failure 500
// @router /websocket/pod [get]
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

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
	}

	token, err := handler.getToken(r, endpoint, false)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to get user service account token", err}
	}

	params := &webSocketRequestParams{
		endpoint: endpoint,
		token:    token,
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

	cli, err := handler.KubernetesClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create Kubernetes client", err}
	}

	err = cli.StartExecProcess(token, namespace, podName, containerName, commandArray, stdinReader, stdoutWriter)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to start exec process inside container", err}
	}

	err = <-errorChan
	if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
		log.Printf("websocket error: %s \n", err.Error())
	}

	return nil
}

func (handler *Handler) getToken(request *http.Request, endpoint *portainer.Endpoint, setLocalAdminToken bool) (string, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return "", err
	}

	kubecli, err := handler.KubernetesClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return "", err
	}

	tokenCache := handler.kubernetesTokenCacheManager.GetOrCreateTokenCache(int(endpoint.ID))

	tokenManager, err := kubernetes.NewTokenManager(kubecli, handler.DataStore, tokenCache, setLocalAdminToken)
	if err != nil {
		return "", err
	}

	if tokenData.Role == portainer.AdministratorRole {
		return tokenManager.GetAdminServiceAccountToken(), nil
	}

	return tokenManager.GetUserServiceAccountToken(int(tokenData.ID))
}
