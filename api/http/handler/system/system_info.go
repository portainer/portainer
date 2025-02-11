package system

import (
	"net/http"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/api/internal/endpointutils"
	plf "github.com/portainer/portainer/api/platform"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type systemInfoResponse struct {
	Platform   plf.ContainerPlatform `json:"platform"`
	EdgeAgents int                   `json:"edgeAgents"`
	Agents     int                   `json:"agents"`
}

// @id systemInfo
// @summary Retrieve system info
// @description **Access policy**: authenticated
// @security ApiKeyAuth
// @security jwt
// @tags system
// @produce json
// @success 200 {object} systemInfoResponse "Success"
// @failure 500 "Server error"
// @router /system/info [get]
func (handler *Handler) systemInfo(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	environments, err := handler.dataStore.Endpoint().Endpoints()
	if err != nil {
		return httperror.InternalServerError("Failed to get environment list", err)
	}

	agents := 0
	edgeAgents := 0

	for _, environment := range environments {
		if endpointutils.IsAgentEndpoint(&environment) {
			agents++
		}

		if endpointutils.IsEdgeEndpoint(&environment) {
			edgeAgents++
		}
	}

	platform, err := handler.platformService.GetPlatform()
	if err != nil {
		if !errors.Is(err, plf.ErrNoLocalEnvironment) {
			return httperror.InternalServerError("Failed to get platform", err)
		}
		// If no local environment is detected, we assume the platform is Docker
		// UI will stop showing the upgrade banner
		platform = plf.PlatformDocker
	}

	return response.JSON(w, &systemInfoResponse{
		EdgeAgents: edgeAgents,
		Agents:     agents,
		Platform:   platform,
	})
}
