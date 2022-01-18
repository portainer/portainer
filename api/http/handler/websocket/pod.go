package websocket

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/portainer/portainer/api/http/security"

	"github.com/gorilla/websocket"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"
)

// @summary Execute a websocket on pod
// @description The request will be upgraded to the websocket protocol.
// @description **Access policy**: authenticated
// @security ApiKeyAuth
// @security jwt
// @tags websocket
// @accept json
// @produce json
// @param endpointId query int true "environment(endpoint) ID of the environment(endpoint) where the resource is located"
// @param namespace query string true "namespace where the container is located"
// @param podName query string true "name of the pod containing the container"
// @param containerName query string true "name of the container"
// @param command query string true "command to execute in the container"
// @param token query string true "JWT token used for authentication against this environment(endpoint)"
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
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find the environment associated to the stack inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find the environment associated to the stack inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access environment", err}
	}

	serviceAccountToken, isAdminToken, err := handler.getToken(r, endpoint, false)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to get user service account token", err}
	}

	params := &webSocketRequestParams{
		endpoint: endpoint,
		token:    serviceAccountToken,
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

	cli, err := handler.KubernetesClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create Kubernetes client", err}
	}

	handlerErr := handler.hijackPodExecStartOperation(w, r, cli, serviceAccountToken, isAdminToken, endpoint, namespace, podName, containerName, command)
	if handlerErr != nil {
		return handlerErr
	}

	return nil
}

func (handler *Handler) hijackPodExecStartOperation(
	w http.ResponseWriter,
	r *http.Request,
	cli portainer.KubeClient,
	serviceAccountToken string,
	isAdminToken bool,
	endpoint *portainer.Endpoint,
	namespace, podName, containerName, command string,
) *httperror.HandlerError {
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

	// errorChan is used to propagate errors from the go routines to the caller.
	errorChan := make(chan error, 1)
	go streamFromWebsocketToWriter(websocketConn, stdinWriter, errorChan)
	go streamFromReaderToWebsocket(websocketConn, stdoutReader, errorChan)

	// StartExecProcess is a blocking operation which streams IO to/from pod;
	// this must execute in asynchronously, since the websocketConn could return errors (e.g. client disconnects) before
	// the blocking operation is completed.
	go cli.StartExecProcess(serviceAccountToken, isAdminToken, namespace, podName, containerName, commandArray, stdinReader, stdoutWriter, errorChan)

	err = <-errorChan

	// websocket client successfully disconnected
	if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
		log.Printf("websocket error: %s \n", err.Error())
		return nil
	}

	return &httperror.HandlerError{http.StatusInternalServerError, "Unable to start exec process inside container", err}
}

func (handler *Handler) getToken(request *http.Request, endpoint *portainer.Endpoint, setLocalAdminToken bool) (string, bool, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return "", false, err
	}

	kubecli, err := handler.KubernetesClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return "", false, err
	}

	tokenCache := handler.kubernetesTokenCacheManager.GetOrCreateTokenCache(int(endpoint.ID))

	tokenManager, err := kubernetes.NewTokenManager(kubecli, handler.DataStore, tokenCache, setLocalAdminToken)
	if err != nil {
		return "", false, err
	}

	if tokenData.Role == portainer.AdministratorRole {
		return tokenManager.GetAdminServiceAccountToken(), true, nil
	}

	token, err := tokenManager.GetUserServiceAccountToken(int(tokenData.ID), endpoint.ID)
	if err != nil {
		return "", false, err
	}

	if token == "" {
		return "", false, fmt.Errorf("can not get a valid user service account token")
	}

	return token, false, nil
}
