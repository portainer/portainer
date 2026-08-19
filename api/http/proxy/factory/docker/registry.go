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
		RegistryId *portainer.RegistryID `json:"registryId"`
	}
)

func createRegistryAuthenticationHeader(
	dataStore dataservices.DataStore,
	registryID portainer.RegistryID,
	accessContext *registryAccessContext,
) (authenticationHeader registryAuthenticationHeader, err error) {
	if registryID == 0 { // dockerhub (anonymous)
		authenticationHeader.Serveraddress = "docker.io"

		return
	}

	// Any "custom" registry
	var matchingRegistry *portainer.Registry

	for _, registry := range accessContext.registries {
		if registry.ID == registryID &&
			(accessContext.isAdmin ||
				security.AuthorizedRegistryAccess(&registry, accessContext.user, accessContext.teamMemberships, accessContext.endpointID)) {
			matchingRegistry = &registry

			break
		}
	}

	if matchingRegistry == nil {
		return
	}

	if err = registryutils.PrepareRegistryCredentials(dataStore, matchingRegistry); err != nil {
		return
	}

	authenticationHeader.Serveraddress = matchingRegistry.URL
	authenticationHeader.Username = matchingRegistry.Username
	authenticationHeader.Password = matchingRegistry.Password

	return
}
