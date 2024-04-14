package docker

import (
	"fmt"
	"net/http"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/api/types/volume"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker"
	dockerconsts "github.com/portainer/portainer/api/docker/consts"
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
	serviceCount := 0
	var services []swarm.Service
	if isSwarmManager {
		servicesRes, err := cli.ServiceList(r.Context(), types.ServiceListOptions{})
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve Docker services", err)
		}

		serviceCount = len(services)
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

	stacksCount, err := countStacks(environment, user, h, containers, isSwarmManager, services)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve stacks", err)
	}

	return response.JSON(w, dashboardResponse{
		Containers: containerStats,
		Images: imagesCounters{
			Total: len(images),
			Size:  totalSize,
		},
		Services: serviceCount,
		Volumes:  len(volumes.Volumes),
		Networks: len(networks),
		Stacks:   stacksCount,
	})
}

func countStacks(environment *portainer.Endpoint, user *portainer.User, h *Handler, containers []types.Container, isSwarmManager bool, services []swarm.Service) (int, error) {
	if !environment.SecuritySettings.AllowStackManagementForRegularUsers && !security.IsAdminRole(user.Role) {
		return 0, nil
	}

	stacks, err := h.dataStore.Stack().ReadAll()
	if err != nil {
		return 0, fmt.Errorf("Unable to retrieve stacks: %w", err)
	}

	stacksCount := 0
	for _, stack := range stacks {
		if stack.EndpointID == environment.ID {
			stacksCount++
		}
	}

	for _, container := range containers {
		if isExternalComposeStack(container.Labels) {
			stacksCount++
		}
	}

	if isSwarmManager {
		for _, service := range services {
			if isExternalSwarmStack(service.Spec.Labels) {
				stacksCount++
			}
		}
	}
	return stacksCount, nil
}

func isExternalComposeStack(labels map[string]string) bool {
	return labels[dockerconsts.HideStackLabel] == "" && labels[dockerconsts.ComposeStackNameLabel] != ""
}

func isExternalSwarmStack(labels map[string]string) bool {
	return labels[dockerconsts.HideStackLabel] == "" && labels[dockerconsts.SwarmStackNameLabel] != ""
}
