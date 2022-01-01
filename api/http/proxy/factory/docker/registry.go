package docker

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/registryutils"
)

type (
	registryAccessContext struct {
		isAdmin         bool
		user            *portainer.User
		endpointID      portainer.EndpointID
		teamMemberships []portainer.TeamMembership
		registries      []portainer.Registry
	}

	registryAuthenticationHeader struct {
		Username      string `json:"username"`
		Password      string `json:"password"`
		Serveraddress string `json:"serveraddress"`
	}

	portainerRegistryAuthenticationHeader struct {
		RegistryId portainer.RegistryID `json:"registryId"`
	}
)

func createRegistryAuthenticationHeader(
	dataStore dataservices.DataStore,
	registryId portainer.RegistryID,
	accessContext *registryAccessContext,
) (authenticationHeader registryAuthenticationHeader, err error) {
	if registryId == 0 { // dockerhub (anonymous)
		authenticationHeader.Serveraddress = "docker.io"
	} else { // any "custom" registry
		var matchingRegistry *portainer.Registry
		for _, registry := range accessContext.registries {
			if registry.ID == registryId &&
				(accessContext.isAdmin ||
					security.AuthorizedRegistryAccess(&registry, accessContext.user, accessContext.teamMemberships, accessContext.endpointID)) {
				matchingRegistry = &registry
				break
			}
		}

		if matchingRegistry != nil {
			err = registryutils.EnsureRegTokenValid(dataStore, matchingRegistry)
			if err != nil {
				return
			}
			authenticationHeader.Serveraddress = matchingRegistry.URL
			authenticationHeader.Username, authenticationHeader.Password, err = registryutils.GetRegEffectiveCredential(matchingRegistry)
		}
	}

	return
}
