package docker

import (
	"net/http"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/api/types/volume"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/docker"
	"github.com/portainer/portainer/api/http/errors"
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
	var resp dashboardResponse
	err := h.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		cli, httpErr := utils.GetClient(r, h.dockerClientFactory)
		if httpErr != nil {
			return httpErr
		}

		context, err := security.RetrieveRestrictedRequestContext(r)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve user details from request context", err)
		}

		containers, err := cli.ContainerList(r.Context(), container.ListOptions{All: true})
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve Docker containers", err)
		}

		containers, err = utils.FilterByResourceControl(tx, containers, portainer.ContainerResourceControl, context, func(c types.Container) string {
			return c.ID
		})
		if err != nil {
			return err
		}

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

			filteredServices, err := utils.FilterByResourceControl(tx, servicesRes, portainer.ServiceResourceControl, context, func(c swarm.Service) string {
				return c.ID
			})
			if err != nil {
				return err
			}

			services = filteredServices
		}

		volumesRes, err := cli.VolumeList(r.Context(), volume.ListOptions{})
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve Docker volumes", err)
		}

		volumes, err := utils.FilterByResourceControl(tx, volumesRes.Volumes, portainer.NetworkResourceControl, context, func(c *volume.Volume) string {
			return c.Name
		})
		if err != nil {
			return err
		}

		networks, err := cli.NetworkList(r.Context(), types.NetworkListOptions{})
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve Docker networks", err)
		}

		networks, err = utils.FilterByResourceControl(tx, networks, portainer.NetworkResourceControl, context, func(c types.NetworkResource) string {
			return c.Name
		})
		if err != nil {
			return err
		}

		environment, err := middlewares.FetchEndpoint(r)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve environment", err)
		}

		stackCount := 0
		if environment.SecuritySettings.AllowStackManagementForRegularUsers || context.IsAdmin {
			stacks, err := utils.GetDockerStacks(tx, context, environment.ID, containers, services)
			if err != nil {
				return httperror.InternalServerError("Unable to retrieve stacks", err)
			}

			stackCount = len(stacks)
		}

		resp = dashboardResponse{
			Images: imagesCounters{
				Total: len(images),
				Size:  totalSize,
			},
			Services:   len(services),
			Containers: docker.CalculateContainerStats(containers),
			Networks:   len(networks),
			Volumes:    len(volumes),
			Stacks:     stackCount,
		}

		return nil
	})

	return errors.TxResponse(err, func() *httperror.HandlerError {
		return response.JSON(w, resp)
	})
}
