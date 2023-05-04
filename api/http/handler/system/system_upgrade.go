package system

import (
	"net/http"
	"regexp"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/platform"
)

type systemUpgradePayload struct {
	License string
}

var re = regexp.MustCompile(`^\d-.+`)

func (payload *systemUpgradePayload) Validate(r *http.Request) error {
	if payload.License == "" {
		return errors.New("license is missing")
	}

	if !re.MatchString(payload.License) {
		return errors.New("license is invalid")
	}

	return nil
}

var platformToEndpointType = map[platform.ContainerPlatform]portainer.EndpointType{
	platform.PlatformDockerStandalone: portainer.DockerEnvironment,
	platform.PlatformDockerSwarm:      portainer.DockerEnvironment,
	platform.PlatformKubernetes:       portainer.KubernetesLocalEnvironment,
}

// @id systemUpgrade
// @summary Upgrade Portainer to BE
// @description Upgrade Portainer to BE
// @description **Access policy**: administrator
// @tags system
// @produce json
// @success 204 {object} status "Success"
// @router /system/upgrade [post]
func (handler *Handler) systemUpgrade(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload, err := request.GetPayload[systemUpgradePayload](r)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	environment, err := handler.guessLocalEndpoint()
	if err != nil {
		return httperror.InternalServerError("Failed to guess local endpoint", err)
	}

	err = handler.upgradeService.Upgrade(environment, payload.License)
	if err != nil {
		return httperror.InternalServerError("Failed to upgrade Portainer", err)
	}

	return response.Empty(w)
}

func (handler *Handler) guessLocalEndpoint() (*portainer.Endpoint, error) {
	platform, err := platform.DetermineContainerPlatform()
	if err != nil {
		return nil, errors.Wrap(err, "failed to determine container platform")
	}

	endpointType, ok := platformToEndpointType[platform]
	if !ok {
		return nil, errors.New("failed to determine endpoint type")
	}

	endpoints, err := handler.dataStore.Endpoint().Endpoints()
	if err != nil {
		return nil, errors.Wrap(err, "failed to retrieve endpoints")
	}

	for _, endpoint := range endpoints {
		if endpoint.Type == endpointType {
			return &endpoint, nil
		}
	}

	return nil, errors.New("failed to find local endpoint")
}
