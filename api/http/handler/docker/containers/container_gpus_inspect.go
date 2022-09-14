package containers

import (
	"net/http"
	"strings"

	containertypes "github.com/docker/docker/api/types/container"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/middlewares"
	"golang.org/x/exp/slices"
)

type containerGpusResponse struct {
	Gpus string `json:"gpus"`
}

// @id dockerContainerGpusInspect
// @summary Fetch container gpus data
// @description
// @description **Access policy**:
// @tags docker
// @security jwt
// @accept json
// @produce json
// @param environmentId path int true "Environment identifier"
// @param containerId path int true "Container identifier"
// @success 200 {object} containerGpusResponse "Success"
// @failure 404 "Environment or container not found"
// @failure 400 "Bad request"
// @failure 500 "Internal server error"
// @router /docker/{environmentId}/containers/{containerId}/gpus [get]
func (handler *Handler) containerGpusInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	containerId, err := request.RetrieveRouteVariableValue(r, "containerId")
	if err != nil {
		return httperror.BadRequest("Invalid container identifier route variable", err)
	}

	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.NotFound("Unable to find an environment on request context", err)
	}

	agentTargetHeader := r.Header.Get(portainer.PortainerAgentTargetHeader)

	cli, err := handler.dockerClientFactory.CreateClient(endpoint, agentTargetHeader, nil)
	if err != nil {
		return httperror.InternalServerError("Unable to connect to the Docker daemon", err)
	}

	container, err := cli.ContainerInspect(r.Context(), containerId)
	if err != nil {
		return httperror.NotFound("Unable to find the container", err)
	}

	if container.HostConfig == nil {
		return httperror.NotFound("Unable to find the container host config", err)
	}

	gpuOptionsIndex := slices.IndexFunc(container.HostConfig.DeviceRequests, func(opt containertypes.DeviceRequest) bool {
		if opt.Driver == "nvidia" {
			return true
		}

		if len(opt.Capabilities) == 0 || len(opt.Capabilities[0]) == 0 {
			return false
		}

		return opt.Capabilities[0][0] == "gpu"
	})

	if gpuOptionsIndex == -1 {
		return response.JSON(w, containerGpusResponse{Gpus: "none"})
	}

	gpuOptions := container.HostConfig.DeviceRequests[gpuOptionsIndex]

	gpu := "all"
	if gpuOptions.Count != -1 {
		gpu = "id:" + strings.Join(gpuOptions.DeviceIDs, ",")
	}

	return response.JSON(w, containerGpusResponse{Gpus: gpu})
}
