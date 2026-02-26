package docker

import (
	"errors"
	"net/http"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/api/types/volume"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/docker/stats"
	"github.com/portainer/portainer/api/http/handler/docker/utils"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/uac"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type imagesCounters struct {
	Total int   `json:"total"`
	Size  int64 `json:"size"`
}

type dashboardResponse struct {
	Containers stats.ContainerStats `json:"containers"`
	Services   int                  `json:"services"`
	Images     imagesCounters       `json:"images"`
	Volumes    int                  `json:"volumes"`
	Networks   int                  `json:"networks"`
	Stacks     int                  `json:"stacks"`
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
// @router /docker/{environmentId}/dashboard [get]
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
		user, err := tx.User().Read(context.UserID)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve user", err)
		}

		endpoint, err := middlewares.FetchEndpoint(r)
		if err != nil {
			return err
		}

		containers, err := cli.ContainerList(r.Context(), container.ListOptions{All: true})
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve Docker containers", err)
		}

		if containers, err = uac.FilterByResourceControl(containers, user, context.UserMemberships, uac.ContainerResourceControlGetter(tx, endpoint.ID)); err != nil {
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

			if services, err = uac.FilterByResourceControl(servicesRes, user, context.UserMemberships, uac.ServiceResourceControlGetter(tx, endpoint.ID)); err != nil {
				return err
			}
		}

		volumesRes, err := cli.VolumeList(r.Context(), volume.ListOptions{})
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve Docker volumes", err)
		}

		var volumes []*volume.Volume
		if volumes, err = uac.FilterByResourceControl(volumesRes.Volumes, user, context.UserMemberships, func(item *volume.Volume) (*portainer.ResourceControl, error) {
			if item == nil {
				return nil, errors.New("Found nil volume in volumes list")
			}
			return uac.VolumeResourceControlGetter(tx, endpoint.ID)(*item)
		}); err != nil {
			return err
		}

		networks, err := cli.NetworkList(r.Context(), network.ListOptions{})
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve Docker networks", err)
		}

		if networks, err = uac.FilterByResourceControl(networks, user, context.UserMemberships, uac.NetworkResourceControlGetter(tx, endpoint.ID)); err != nil {
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

		containersStats, err := stats.CalculateContainerStats(r.Context(), cli, info.Swarm.ControlAvailable, containers)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve Docker containers stats", err)
		}

		resp = dashboardResponse{
			Images: imagesCounters{
				Total: len(images),
				Size:  totalSize,
			},
			Services:   len(services),
			Containers: containersStats,
			Networks:   len(networks),
			Volumes:    len(volumes),
			Stacks:     stackCount,
		}

		return nil
	})

	return response.TxResponse(w, resp, err)
}
