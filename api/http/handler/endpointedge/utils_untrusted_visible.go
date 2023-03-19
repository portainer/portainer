package endpointedge

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
)

func (handler *Handler) makeUntrustedEnvironmentVisible(environment *portainer.Endpoint) {
	if environment.UserTrusted {
		return
	}

	environment.Edge.Hidden = false
	err := handler.DataStore.Endpoint().UpdateEndpoint(environment.ID, environment)
	if err != nil {
		log.Error().Err(err).Msg("Unable to update endpoint")
	}
}
