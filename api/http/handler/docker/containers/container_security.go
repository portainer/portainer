package containers

import (
	"fmt"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker/containersecurity"
	"github.com/portainer/portainer/api/http/middlewares"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id dockerContainerSecurityInspect
// @summary Evaluate the security configuration of a container
// @description
// @description **Access policy**:
// @tags docker
// @security jwt
// @produce json
// @param environmentId path int true "Environment identifier"
// @param containerId path string true "Container identifier"
// @success 200 {object} containersecurity.Report "Success"
// @failure 400 "Bad request"
// @failure 404 "Environment or container not found"
// @failure 500 "Internal server error"
// @router /docker/{environmentId}/containers/{containerId}/security [get]
func (handler *Handler) containerSecurityInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
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

	in := containersecurity.Input{}

	if container.Config != nil {
		in.Image = container.Config.Image
		in.User = container.Config.User
	}

	if container.HostConfig != nil {
		in.MemoryLimit = container.HostConfig.Memory
		in.NanoCPUs = container.HostConfig.NanoCPUs
		in.Privileged = container.HostConfig.Privileged
		in.ReadonlyRootfs = container.HostConfig.ReadonlyRootfs
		in.Binds = container.HostConfig.Binds
		in.CapAdd = container.HostConfig.CapAdd
		in.CapDrop = container.HostConfig.CapDrop
		in.NetworkMode = string(container.HostConfig.NetworkMode)
		in.SecurityOpt = container.HostConfig.SecurityOpt

		for _, bindings := range container.HostConfig.PortBindings {
			for _, b := range bindings {
				in.PortBindings = append(in.PortBindings, containersecurity.PortBinding{
					HostIP:   fmt.Sprint(b.HostIP),
					HostPort: b.HostPort,
				})
			}
		}
	}

	for _, m := range container.Mounts {
		in.MountSources = append(in.MountSources, m.Source)
	}

	return response.JSON(w, containersecurity.Evaluate(in))
}
