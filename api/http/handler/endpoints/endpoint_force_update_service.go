package endpoints

import (
	"context"
	"net/http"
	"strings"

	dockertypes "github.com/docker/docker/api/types"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/useractivity"
)

type forceUpdateServicePayload struct {
	ServiceID string
	PullImage bool
}

func (payload *forceUpdateServicePayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/endpoints/:id/forceupdateservice
func (handler *Handler) endpointForceUpdateService(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	var payload forceUpdateServicePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint, true)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to force update service", err}
	}

	dockerClient, err := handler.DockerClientFactory.CreateClient(endpoint, "")
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Error creating docker client", err}
	}
	defer dockerClient.Close()

	service, _, err := dockerClient.ServiceInspectWithRaw(context.Background(), payload.ServiceID, dockertypes.ServiceInspectOptions{InsertDefaults: true})
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Error looking up service", err}
	}

	service.Spec.TaskTemplate.ForceUpdate++

	if payload.PullImage {
		service.Spec.TaskTemplate.ContainerSpec.Image = strings.Split(service.Spec.TaskTemplate.ContainerSpec.Image, ":")[0]
	}

	newService, err := dockerClient.ServiceUpdate(context.Background(), payload.ServiceID, service.Version, service.Spec, dockertypes.ServiceUpdateOptions{QueryRegistry: true})
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Error force update service", err}
	}

	useractivity.LogHttpActivity(handler.UserActivityStore, endpoint.Name, r, payload)

	return response.JSON(w, newService)
}
