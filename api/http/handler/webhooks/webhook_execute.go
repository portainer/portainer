package webhooks

import (
	"context"
	"errors"
	"github.com/portainer/portainer/api/internal/registryutils"
	"io"
	"net/http"
	"strings"

	dockertypes "github.com/docker/docker/api/types"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

// @summary Execute a webhook
// @description Acts on a passed in token UUID to restart the docker service
// @description **Access policy**: public
// @tags webhooks
// @param token path string true "Webhook token"
// @success 202 "Webhook executed"
// @failure 400
// @failure 500
// @router /webhooks/{token} [post]
func (handler *Handler) webhookExecute(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	webhookToken, err := request.RetrieveRouteVariableValue(r, "token")

	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Invalid service id parameter", err}
	}

	webhook, err := handler.DataStore.Webhook().WebhookByToken(webhookToken)

	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a webhook with this token", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve webhook from the database", err}
	}

	resourceID := webhook.ResourceID
	endpointID := webhook.EndpointID
	registryID := webhook.RegistryID
	webhookType := webhook.WebhookType

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an environment with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an environment with the specified identifier inside the database", err}
	}

	imageTag, _ := request.RetrieveQueryParameter(r, "tag", true)

	switch webhookType {
	case portainer.ServiceWebhook:
		return handler.executeServiceWebhook(w, endpoint, resourceID, registryID, imageTag)
	default:
		return &httperror.HandlerError{http.StatusInternalServerError, "Unsupported webhook type", errors.New("Webhooks for this resource are not currently supported")}
	}
}

func (handler *Handler) executeServiceWebhook(
	w http.ResponseWriter,
	endpoint *portainer.Endpoint,
	resourceID string,
	registryID portainer.RegistryID,
	imageTag string,
) *httperror.HandlerError {
	dockerClient, err := handler.DockerClientFactory.CreateClient(endpoint, "", nil)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Error creating docker client", err}
	}
	defer dockerClient.Close()

	service, _, err := dockerClient.ServiceInspectWithRaw(context.Background(), resourceID, dockertypes.ServiceInspectOptions{InsertDefaults: true})
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Error looking up service", err}
	}

	service.Spec.TaskTemplate.ForceUpdate++

	var imageName = strings.Split(service.Spec.TaskTemplate.ContainerSpec.Image, "@sha")[0]

	if imageTag != "" {
		var tagIndex = strings.LastIndex(imageName, ":")
		if tagIndex == -1 {
			tagIndex = len(imageName)
		}
		service.Spec.TaskTemplate.ContainerSpec.Image = imageName[:tagIndex] + ":" + imageTag
	} else {
		service.Spec.TaskTemplate.ContainerSpec.Image = imageName
	}

	serviceUpdateOptions := dockertypes.ServiceUpdateOptions{
		QueryRegistry: true,
	}

	if registryID != 0 {
		registry, err := handler.DataStore.Registry().Registry(registryID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Error getting registry", err}
		}

		if registry.Authentication {
			registryutils.EnsureRegTokenValid(handler.DataStore, registry)
			serviceUpdateOptions.EncodedRegistryAuth, err = registryutils.GetRegistryAuthHeader(registry)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Error getting registry auth header", err}
			}
		}
	}
	if imageTag != "" {
		rc, err := dockerClient.ImagePull(context.Background(), service.Spec.TaskTemplate.ContainerSpec.Image, dockertypes.ImagePullOptions{RegistryAuth: serviceUpdateOptions.EncodedRegistryAuth})
		if err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Error pulling image with the specified tag", Err: err}
		}
		defer func(rc io.ReadCloser) {
			_ = rc.Close()
		}(rc)
	}
	_, err = dockerClient.ServiceUpdate(context.Background(), resourceID, service.Version, service.Spec, serviceUpdateOptions)

	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Error updating service", err}
	}
	return response.Empty(w)
}
