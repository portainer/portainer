package docker

import (
	"net/http"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/api/types/volume"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker"
	"github.com/portainer/portainer/api/http/handler/docker/utils"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type imagesCounters struct {
	Total int   `json:"total"`
	Size  int64 `json:"size"`
}

type dashboardResponse struct {
	Containers docker.ContainerStats `json:"containers"`
	Services   int                   `json:"services"`
	Images     imagesCounters        `json:"images"`
	Volumes    int                   `json:"volumes"`
	Networks   int                   `json:"networks"`
	Stacks     int                   `json:"stacks"`
}

// @id dockerDashboard
// @summary Get counters for the dashboard
// @description **Access policy**: restricted
// @tags docker
// @security jwt
// @param environmentId path int true "Environment identifier"
// @accept json
// @produce json
// @success 200 {object} dashboardResponse "Success"
// @failure 400 "Bad request"
// @failure 500 "Internal server error"
// @router /docker/{environmentId}/dashboard [post]
func (h *Handler) dashboard(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := utils.GetClient(r, h.dockerClientFactory)
	if httpErr != nil {
		return httpErr
	}

	containers, err := cli.ContainerList(r.Context(), container.ListOptions{All: true})
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve Docker containers", err)
	}

	containerStats := docker.CalculateContainerStats(containers)

	images, err := cli.ImageList(r.Context(), image.ListOptions{})
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve Docker images", err)
	}

	var totalSize int64
	for _, image := range images {
		totalSize += image.Size
	}

	info, err := cli.Info(r.Context())
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve Docker info", err)
	}

	isSwarmManager := info.Swarm.ControlAvailable && info.Swarm.NodeID != ""

	var services []swarm.Service
	if isSwarmManager {
		servicesRes, err := cli.ServiceList(r.Context(), types.ServiceListOptions{})
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve Docker services", err)
		}

		services = servicesRes
	}

	volumes, err := cli.VolumeList(r.Context(), volume.ListOptions{})
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve Docker volumes", err)
	}

	networks, err := cli.NetworkList(r.Context(), types.NetworkListOptions{})
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve Docker networks", err)
	}

	environment, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve environment", err)
	}

	user, err := security.RetrieveUserFromRequest(r, h.dataStore)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user", err)
	}

	stackCount := 0
	if environment.SecuritySettings.AllowStackManagementForRegularUsers || user.Role == portainer.AdministratorRole {
		stacks, err := utils.GetDockerStacks(h.dataStore, environment.ID, containers, services)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve stacks", err)
		}

		stackCount = len(stacks)
	}

	return response.JSON(w, dashboardResponse{
		Containers: containerStats,
		Images: imagesCounters{
			Total: len(images),
			Size:  totalSize,
		},
		Services: len(services),
		Volumes:  len(volumes.Volumes),
		Networks: len(networks),
		Stacks:   stackCount,
	})
}
