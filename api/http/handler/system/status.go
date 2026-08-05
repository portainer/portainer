package system

import (
	"net/http"
	"time"

	portainer "github.com/portainer/portainer/api"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/rs/zerolog/log"
)

type status struct {
	*portainer.Status
	CurrentTime string `json:"CurrentTime"`
}

// @id systemStatus
// @summary Check Portainer status
// @description Retrieve Portainer status
// @description **Access policy**: public
// @tags system
// @produce json
// @success 200 {object} status "Success"
// @router /system/status [get]
func (handler *Handler) systemStatus(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	return response.JSON(w, &status{
		Status:      handler.status,
		CurrentTime: time.Now().Format(time.RFC3339),
	})
}

// swagger docs for deprecated route:
// @id StatusInspect
// @summary Check Portainer status
// @deprecated
// @description Deprecated: use the `/system/status` endpoint instead.
// @description Retrieve Portainer status
// @description **Access policy**: public
// @tags status
// @produce json
// @success 200 {object} status "Success"
// @router /status [get]
func (handler *Handler) statusInspectDeprecated(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	log.Warn().Msg("The /status endpoint is deprecated and will be removed in a future version of Portainer. Please use the /system/status endpoint instead.")

	return handler.systemStatus(w, r)
}
