package endpoints

import (
	"context"
	"net/http"
	"strings"

	portaineree "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/docker/images"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/api/uac"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"

	cerrdefs "github.com/containerd/errdefs"
	dockertypes "github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/swarm"
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
// @failure 404 "endpoint not found, or service not found or not accessible"
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
	closeClient := true
	defer func() {
		if closeClient {
			logs.CloseAndLogErr(dockerClient)
		}
	}()

	service, _, err := dockerClient.ServiceInspectWithRaw(
		context.Background(),
		payload.ServiceID,
		dockertypes.ServiceInspectOptions{InsertDefaults: true},
	)
	if cerrdefs.IsNotFound(err) {
		return httperror.NotFound("service not found", nil)
	} else if err != nil {
		return httperror.InternalServerError("Error looking up service", err)
	}

	if httpErr := handler.authorizeServiceForceUpdate(r, endpoint, service); httpErr != nil {
		return httpErr
	}

	service.Spec.TaskTemplate.ForceUpdate++

	if payload.PullImage {
		service.Spec.TaskTemplate.ContainerSpec.Image = strings.Split(service.Spec.TaskTemplate.ContainerSpec.Image, "@sha")[0]
	}

	newService, err := dockerClient.ServiceUpdate(
		context.Background(),
		service.ID,
		service.Version,
		service.Spec,
		dockertypes.ServiceUpdateOptions{QueryRegistry: true},
	)
	if err != nil {
		return httperror.InternalServerError("Error force update service", err)
	}

	// The goroutine will close the client
	closeClient = false

	go func() {
		defer logs.CloseAndLogErr(dockerClient)

		images.EvictImageStatus(service.ID)
		images.EvictImageStatus(service.Spec.Labels[consts.SwarmStackNameLabel])

		// ignore errors from this cleanup function, log them instead
		containers, err := dockerClient.ContainerList(context.TODO(), container.ListOptions{
			All:     true,
			Filters: filters.NewArgs(filters.Arg("label", consts.SwarmServiceIDLabel+"="+service.ID)),
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

// authorizeServiceForceUpdate applies the service resource control, as the Docker proxy does for service updates
func (handler *Handler) authorizeServiceForceUpdate(
	r *http.Request,
	endpoint *portaineree.Endpoint,
	service swarm.Service,
) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user details from request context", err)
	}

	if securityContext.IsAdmin {
		return nil
	}

	var resourceControl *portaineree.ResourceControl
	if err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		resourceControl, err = uac.ServiceResourceControlGetter(tx, endpoint.ID)(service)
		return err
	}); err != nil {
		return httperror.InternalServerError("Unable to verify service access", err)
	}

	if !authorization.UserCanAccessResource(
		securityContext.UserID,
		authorization.TeamIDs(securityContext.UserMemberships),
		resourceControl,
	) {
		// returned a 404 both for missing services and for services the caller cannot access,
		// so the response does not reveal whether a service exists
		return httperror.NotFound("service not found", nil)
	}

	return nil
}
