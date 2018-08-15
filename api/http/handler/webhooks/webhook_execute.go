package webhooks

import (
	"context"
	"net/http"

	dockertypes "github.com/docker/docker/api/types"
	docker "github.com/docker/docker/client"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
)

func (handler *Handler) webhookExecute(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	webhookToken, err := request.RetrieveRouteVariableValue(r, "token")

	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Invalid service id parameter", err}
	}

	webhook, err := handler.WebhookService.WebhookByToken(webhookToken)
	if err != nil && err != portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve webhook from the database", err}
	}

	serviceID := webhook.ServiceID
	endpointID := webhook.EndpointID

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	var dockerClient *docker.Client
	if endpoint.TLSConfig.TLS {
		dockerClient, err = docker.NewClientWithOpts(docker.WithHost(endpoint.URL),
			docker.WithTLSClientConfig(
				endpoint.TLSConfig.TLSCACertPath,
				endpoint.TLSConfig.TLSCertPath,
				endpoint.TLSConfig.TLSKeyPath),
		)
	} else {
		dockerClient, err = docker.NewClientWithOpts(docker.WithHost(endpoint.URL))
	}
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Error creating docker client", err}
	}

	service, _, err := dockerClient.ServiceInspectWithRaw(context.TODO(), serviceID, dockertypes.ServiceInspectOptions{InsertDefaults: true})
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Error looking up service", err}
	}

	resp, err := dockerClient.ServiceUpdate(context.TODO(), serviceID, service.Version, service.Spec, dockertypes.ServiceUpdateOptions{QueryRegistry: true})

	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Error updating service", err}
	}
	if resp.Warnings != nil {
		//Log warnings
	}
	return nil

}
