package webhooks

import (
	"context"
	"errors"
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/registryutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	dockertypes "github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/image"
)

// @summary Execute a webhook
// @description Acts on a passed in token UUID to restart the docker service
// @description **Access policy**: public
// @tags webhooks
// @param id path string true "Webhook token"
// @success 202 "Webhook executed"
// @failure 400
// @failure 500
// @router /webhooks/{id} [post]
func (handler *Handler) webhookExecute(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	webhookToken, err := request.RetrieveRouteVariableValue(r, "token")
	if err != nil {
		return httperror.InternalServerError("Invalid service id parameter", err)
	}

	webhook, err := handler.DataStore.Webhook().WebhookByToken(webhookToken)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a webhook with this token", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to retrieve webhook from the database", err)
	}

	resourceID := webhook.ResourceID
	endpointID := webhook.EndpointID
	registryID := webhook.RegistryID
	webhookType := webhook.WebhookType

	endpoint, err := handler.DataStore.Endpoint().Endpoint(endpointID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	imageTag, _ := request.RetrieveQueryParameter(r, "tag", true)

	switch webhookType {
	case portainer.ServiceWebhook:
		return handler.executeServiceWebhook(w, endpoint, resourceID, registryID, imageTag)
	default:
		return httperror.InternalServerError("Unsupported webhook type", errors.New("Webhooks for this resource are not currently supported"))
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
		return httperror.InternalServerError("Error creating docker client", err)
	}
	defer dockerClient.Close()

	service, _, err := dockerClient.ServiceInspectWithRaw(context.Background(), resourceID, dockertypes.ServiceInspectOptions{InsertDefaults: true})
	if err != nil {
		return httperror.InternalServerError("Error looking up service", err)
	}

	service.Spec.TaskTemplate.ForceUpdate++

	imageName := strings.Split(service.Spec.TaskTemplate.ContainerSpec.Image, "@sha")[0]
	service.Spec.TaskTemplate.ContainerSpec.Image = imageName

	if imageTag != "" {
		tagIndex := strings.LastIndex(imageName, ":")
		if tagIndex == -1 {
			tagIndex = len(imageName)
		}

		service.Spec.TaskTemplate.ContainerSpec.Image = imageName[:tagIndex] + ":" + imageTag
	}

	serviceUpdateOptions := dockertypes.ServiceUpdateOptions{
		QueryRegistry: true,
	}

	if registryID != 0 {
		registry, err := handler.DataStore.Registry().Read(registryID)
		if err != nil {
			return httperror.InternalServerError("Error getting registry", err)
		}

		if registry.Authentication {
			registryutils.EnsureRegTokenValid(handler.DataStore, registry)
			serviceUpdateOptions.EncodedRegistryAuth, err = registryutils.GetRegistryAuthHeader(registry)
			if err != nil {
				return httperror.InternalServerError("Error getting registry auth header", err)
			}
		}
	}

	if imageTag != "" {
		rc, err := dockerClient.ImagePull(context.Background(), service.Spec.TaskTemplate.ContainerSpec.Image, image.PullOptions{RegistryAuth: serviceUpdateOptions.EncodedRegistryAuth})
		if err != nil {
			return httperror.NotFound("Error pulling image with the specified tag", err)
		}
		defer rc.Close()
	}

	if _, err := dockerClient.ServiceUpdate(context.Background(), resourceID, service.Version, service.Spec, serviceUpdateOptions); err != nil {
		return httperror.InternalServerError("Error updating service", err)
	}

	return response.Empty(w)
}
