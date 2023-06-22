package containers

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/docker/images"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/rs/zerolog/log"
)

type RecreatePayload struct {
	// PullImage if true will pull the image
	PullImage bool `json:"PullImage"`
}

func (r RecreatePayload) Validate(request *http.Request) error {
	return nil
}

func (handler *Handler) recreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	containerID, err := request.RetrieveRouteVariableValue(r, "containerId")
	if err != nil {
		return httperror.BadRequest("Invalid containerId", err)
	}

	var payload RecreatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.NotFound("Unable to find an environment on request context", err)
	}

	err = handler.bouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return httperror.Forbidden("Permission denied to force update service", err)
	}

	agentTargetHeader := r.Header.Get(portainer.PortainerAgentTargetHeader)

	newContainer, err := handler.containerService.Recreate(r.Context(), endpoint, containerID, payload.PullImage, "", agentTargetHeader)
	if err != nil {
		return httperror.InternalServerError("Error recreating container", err)
	}

	handler.updateWebhook(containerID, newContainer.ID)
	handler.createResourceControl(containerID, newContainer.ID)

	go func() {
		images.EvictImageStatus(containerID)
		images.EvictImageStatus(newContainer.Config.Labels[consts.ComposeStackNameLabel])
		images.EvictImageStatus(newContainer.Config.Labels[consts.SwarmServiceIdLabel])
	}()
	return response.JSON(w, newContainer)
}

func (handler *Handler) createResourceControl(oldContainerId string, newContainerId string) {
	resourceControls, err := handler.dataStore.ResourceControl().ReadAll()
	if err != nil {
		log.Error().Err(err).Msg("Exporting Resource Controls")
		return
	}

	resourceControl := authorization.GetResourceControlByResourceIDAndType(oldContainerId, portainer.ContainerResourceControl, resourceControls)
	if resourceControl == nil {
		return
	}
	resourceControl.ResourceID = newContainerId
	err = handler.dataStore.ResourceControl().Create(resourceControl)
	if err != nil {
		log.Error().Err(err).Str("containerId", newContainerId).Msg("Failed to create new resource control for container")
		return
	}
}

func (handler *Handler) updateWebhook(oldContainerId string, newContainerId string) {
	webhook, err := handler.dataStore.Webhook().WebhookByResourceID(oldContainerId)
	if err != nil {
		log.Error().Err(err).Str("containerId", oldContainerId).Msg("cannot find webhook by containerId")
		return
	}

	webhook.ResourceID = newContainerId
	err = handler.dataStore.Webhook().Update(webhook.ID, webhook)
	if err != nil {
		log.Error().Err(err).Int("webhookId", int(webhook.ID)).Msg("cannot update webhook")
	}
}
