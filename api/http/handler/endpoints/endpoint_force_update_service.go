package endpoints

import (
	"context"
	"net/http"
	"strings"

	portaineree "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/docker/images"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"

	dockertypes "github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
)

type forceUpdateServicePayload struct {
	// ServiceId to update
	ServiceID string
	// PullImage if true will pull the image
	PullImage bool
}

func (payload *forceUpdateServicePayload) Validate(r *http.Request) error {
	return nil
}

// @id endpointForceUpdateService
// @summary force update a docker service
// @description force update a docker service
// @description **Access policy**: authenticated
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "endpoint identifier"
// @param body body forceUpdateServicePayload true "details"
// @success 200 {object} swarm.ServiceUpdateResponse "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "endpoint not found"
// @failure 500 "Server error"
// @router /endpoints/{id}/forceupdateservice [put]
func (handler *Handler) endpointForceUpdateService(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid environment identifier route variable", err)
	}

	var payload forceUpdateServicePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portaineree.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return httperror.Forbidden("Permission denied to force update service", err)
	}

	dockerClient, err := handler.DockerClientFactory.CreateClient(endpoint, "", nil)
	if err != nil {
		return httperror.InternalServerError("Error creating docker client", err)
	}
	defer dockerClient.Close()

	service, _, err := dockerClient.ServiceInspectWithRaw(context.Background(), payload.ServiceID, dockertypes.ServiceInspectOptions{InsertDefaults: true})
	if err != nil {
		return httperror.InternalServerError("Error looking up service", err)
	}

	service.Spec.TaskTemplate.ForceUpdate++

	if payload.PullImage {
		service.Spec.TaskTemplate.ContainerSpec.Image = strings.Split(service.Spec.TaskTemplate.ContainerSpec.Image, "@sha")[0]
	}

	newService, err := dockerClient.ServiceUpdate(context.Background(), payload.ServiceID, service.Version, service.Spec, dockertypes.ServiceUpdateOptions{QueryRegistry: true})
	if err != nil {
		return httperror.InternalServerError("Error force update service", err)
	}

	go func() {
		images.EvictImageStatus(payload.ServiceID)
		images.EvictImageStatus(service.Spec.Labels[consts.SwarmStackNameLabel])
		// ignore errors from this cleanup function, log them instead
		containers, err := dockerClient.ContainerList(context.TODO(), container.ListOptions{
			All:     true,
			Filters: filters.NewArgs(filters.Arg("label", consts.SwarmServiceIDLabel+"="+payload.ServiceID)),
		})
		if err != nil {
			log.Warn().Err(err).Str("Environment", endpoint.Name).Msg("Error listing containers")
		}

		for _, container := range containers {
			images.EvictImageStatus(container.ID)
		}
	}()

	return response.JSON(w, newService)
}
