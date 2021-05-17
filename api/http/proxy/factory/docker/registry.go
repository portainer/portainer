package docker

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
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

func createRegistryAuthenticationHeader(registryId portainer.RegistryID, accessContext *registryAccessContext) *registryAuthenticationHeader {
	var authenticationHeader *registryAuthenticationHeader

	if registryId == 0 { // dockerhub (anonymous)
		authenticationHeader = &registryAuthenticationHeader{
			Serveraddress: "docker.io",
		}
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
			authenticationHeader = &registryAuthenticationHeader{
				Username:      matchingRegistry.Username,
				Password:      matchingRegistry.Password,
				Serveraddress: matchingRegistry.URL,
			}
		}
	}

	return authenticationHeader
}
