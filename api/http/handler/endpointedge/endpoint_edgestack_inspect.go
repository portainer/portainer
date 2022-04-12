package endpointedge

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/internal/endpointutils"
)

type configResponse struct {
	StackFileContent string
	Name             string
}

// @summary Inspect an Edge Stack for an Environment(Endpoint)
// @description **Access policy**: public
// @tags edge, endpoints, edge_stacks
// @accept json
// @produce json
// @param id path string true "environment(endpoint) Id"
// @param stackId path string true "EdgeStack Id"
// @success 200 {object} configResponse
// @failure 500
// @failure 400
// @failure 404
// @router /endpoints/{id}/edge/stacks/{stackId} [get]
func (handler *Handler) endpointEdgeStackInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.BadRequest("Unable to find an environment on request context", err)
	}

	err = handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access environment", err}
	}

	edgeStackID, err := request.RetrieveNumericRouteVariableValue(r, "stackId")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid edge stack identifier route variable", err}
	}

	edgeStack, err := handler.DataStore.EdgeStack().EdgeStack(portainer.EdgeStackID(edgeStackID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an edge stack with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an edge stack with the specified identifier inside the database", err}
	}

	fileName := edgeStack.EntryPoint
	if endpointutils.IsDockerEndpoint(endpoint) {
		if fileName == "" {
			return &httperror.HandlerError{http.StatusBadRequest, "Docker is not supported by this stack", errors.New("Docker is not supported by this stack")}
		}
	}

	if endpointutils.IsKubernetesEndpoint(endpoint) {
		fileName = edgeStack.ManifestPath

		if fileName == "" {
			return &httperror.HandlerError{http.StatusBadRequest, "Kubernetes is not supported by this stack", errors.New("Kubernetes is not supported by this stack")}
		}
	}

	stackFileContent, err := handler.FileService.GetFileContent(edgeStack.ProjectPath, fileName)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve Compose file from disk", err}
	}

	return response.JSON(w, configResponse{
		StackFileContent: string(stackFileContent),
		Name:             edgeStack.Name,
	})
}
