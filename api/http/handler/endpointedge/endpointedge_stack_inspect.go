package endpointedge

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edge"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"golang.org/x/sync/singleflight"
)

var edgeStackSingleFlightGroup = singleflight.Group{}

// @summary Inspect an Edge Stack for an Environment
// @description **Access policy**: Edge agent only — requires X-PortainerAgent-EdgeID header
// @tags edge_agent, edge_stacks
// @accept json
// @produce json
// @param id path int true "environment Id"
// @param stackId path int true "EdgeStack Id"
// @success 200 {object} edge.StackPayload
// @failure 500
// @failure 400
// @failure 404
// @router /endpoints/{id}/edge/stacks/{stackId} [get]
func (handler *Handler) endpointEdgeStackInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.BadRequest("Unable to find an environment on request context", err)
	}

	if err := handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint); err != nil {
		return httperror.Forbidden("Permission denied to access environment", fmt.Errorf("unauthorized edge endpoint operation: %w. Environment ID: %d", err, endpoint.ID))
	}

	edgeStackID, err := request.RetrieveNumericRouteVariableValue(r, "stackId")
	if err != nil {
		return httperror.BadRequest("Invalid edge stack identifier route variable", fmt.Errorf("invalid Edge stack route variable: %w. Environment ID: %d", err, endpoint.ID))
	}

	s, err, _ := edgeStackSingleFlightGroup.Do(strconv.Itoa(edgeStackID), func() (any, error) {
		edgeStack, err := handler.DataStore.EdgeStack().EdgeStack(portainer.EdgeStackID(edgeStackID))
		if handler.DataStore.IsErrObjectNotFound(err) {
			return nil, httperror.NotFound("Unable to find an edge stack with the specified identifier inside the database", fmt.Errorf("unable to find the Edge stack from database: %w. Environment ID: %d", err, endpoint.ID))
		}

		return edgeStack, err
	})
	if err != nil {
		var httpErr *httperror.HandlerError
		if errors.As(err, &httpErr) {
			return httpErr
		}

		return httperror.InternalServerError("Unable to find an edge stack with the specified identifier inside the database", fmt.Errorf("failed to find Edge stack from the database: %w. Environment ID: %d", err, endpoint.ID))
	}

	// WARNING: this variable must not be mutated
	edgeStack := s.(*portainer.EdgeStack)

	relation, err := handler.DataStore.EndpointRelation().EndpointRelation(endpoint.ID)
	if err != nil && !handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.InternalServerError("Unable to retrieve relation object from the database", fmt.Errorf("%w. Environment ID: %d", err, endpoint.ID))
	}

	if relation == nil || !relation.EdgeStacks[edgeStack.ID] {
		return httperror.Forbidden("Permission denied to access this Edge stack", fmt.Errorf("Edge stack %d is not assigned to environment %d", edgeStack.ID, endpoint.ID))
	}

	fileName := edgeStack.EntryPoint
	if endpointutils.IsDockerEndpoint(endpoint) {
		if fileName == "" {
			return httperror.BadRequest("Docker is not supported by this stack", fmt.Errorf("no filename is provided for the Docker endpoint. Environment ID: %d", endpoint.ID))
		}
	}

	namespace := ""
	if !edgeStack.UseManifestNamespaces {
		namespace = kubernetes.DefaultNamespace
	}

	if endpointutils.IsKubernetesEndpoint(endpoint) {
		fileName = edgeStack.ManifestPath

		if fileName == "" {
			return httperror.BadRequest("Kubernetes is not supported by this stack", fmt.Errorf("no filename is provided for the Kubernetes endpoint. Environment ID: %d", endpoint.ID))
		}
	}

	dirEntries, err := filesystem.LoadDir(edgeStack.ProjectPath)
	if err != nil {
		return httperror.InternalServerError("Unable to load repository", fmt.Errorf("failed to load project directory: %w. Environment ID: %d", err, endpoint.ID))
	}

	fileContent, err := filesystem.FilterDirForCompatibility(dirEntries, fileName, endpoint.Agent.Version)
	if err != nil {
		return httperror.InternalServerError("File not found", fmt.Errorf("unable to find file: %w. Environment ID: %d", err, endpoint.ID))
	}

	dirEntries = filesystem.FilterDirForEntryFile(dirEntries, fileName)

	return response.JSON(w, edge.StackPayload{
		DirEntries:       dirEntries,
		EntryFileName:    fileName,
		StackFileContent: fileContent,
		Name:             edgeStack.Name,
		Namespace:        namespace,
		CreatedBy:        edgeStack.CreatedBy,
		CreatedByUserId:  edgeStack.CreatedByUserId,
	})
}
