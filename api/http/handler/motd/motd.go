package motd

import (
	"net/http"

	_ "github.com/portainer/portainer/api/motd"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

// @id MOTD
// @summary fetches the message of the day
// @description **Access policy**: restricted
// @tags motd
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {object} motd.Motd
// @router /motd [get]
func (handler *Handler) motd(w http.ResponseWriter, r *http.Request) {
	motd := handler.motdService.GetCached()

	if err := response.JSON(w, motd); err != nil {
		log.Warn().Err(err).Msg("failed to send MOTD response")
	}
}
