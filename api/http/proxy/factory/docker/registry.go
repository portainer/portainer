package docker

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/registry"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/registryutils"
)

type (
	registryAccessContext struct {
		isAdmin         bool
		user            *portainer.User
		endpointID      database.EndpointID
		teamMemberships []portainer.TeamMembership
		registries      []registry.Registry
	}

	registryAuthenticationHeader struct {
		Username      string `json:"username"`
		Password      string `json:"password"`
		Serveraddress string `json:"serveraddress"`
	}

	portainerRegistryAuthenticationHeader struct {
		RegistryId registry.RegistryID `json:"registryId"`
	}
)

func createRegistryAuthenticationHeader(
	dataStore dataservices.DataStore,
	registryId registry.RegistryID,
	accessContext *registryAccessContext,
) (authenticationHeader registryAuthenticationHeader, err error) {
	if registryId == 0 { // dockerhub (anonymous)
		authenticationHeader.Serveraddress = "docker.io"
	} else { // any "custom" registry
		var matchingRegistry *registry.Registry
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
