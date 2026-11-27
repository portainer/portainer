package endpoints

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker/stats"
	"github.com/portainer/portainer/api/logs"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/docker/docker/api/types/container"
)

// @id endpointContainerMetricsCurrent
// @summary Get current resource metrics for all running containers
// @description Returns live CPU, memory, and block I/O usage for every running
// @description container on the specified environment.
// @description **Access policy**: authenticated
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} stats.ContainerMetric "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Environment not found"
// @failure 500 "Server error"
// @router /endpoints/{id}/metrics/containers/current [get]
func (handler *Handler) endpointContainerMetricsCurrent(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid environment identifier route variable", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return httperror.Forbidden("Permission denied to access environment", err)
	}

	dockerClient, err := handler.DockerClientFactory.CreateClient(endpoint, "", nil)
	if err != nil {
		return httperror.InternalServerError("Unable to create Docker client", err)
	}
	defer logs.CloseAndLogErr(dockerClient)

	containers, err := dockerClient.ContainerList(r.Context(), container.ListOptions{All: false})
	if err != nil {
		return httperror.InternalServerError("Unable to list containers", err)
	}

	metrics, err := stats.FetchContainerMetrics(r.Context(), dockerClient, portainer.EndpointID(endpointID), containers, handler.MetricsCache)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve container metrics", err)
	}

	return response.JSON(w, metrics)
}
