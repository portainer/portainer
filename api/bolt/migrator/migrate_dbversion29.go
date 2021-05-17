package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
)

func (m *Migrator) updateRegistriesToDB30() error {
	registries, err := m.registryService.Registries()
	if err != nil {
		return err
	}

	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, registry := range registries {

		registry.RegistryAccesses = portainer.RegistryAccesses{}

		for _, endpoint := range endpoints {

			filteredUserAccessPolicies := portainer.UserAccessPolicies{}
			for userId, registryPolicy := range registry.UserAccessPolicies {
				if _, found := endpoint.UserAccessPolicies[userId]; found {
					filteredUserAccessPolicies[userId] = registryPolicy
				}
			}

			filteredTeamAccessPolicies := portainer.TeamAccessPolicies{}
			for teamId, registryPolicy := range registry.TeamAccessPolicies {
				if _, found := endpoint.TeamAccessPolicies[teamId]; found {
					filteredTeamAccessPolicies[teamId] = registryPolicy
				}
			}

			registry.RegistryAccesses[endpoint.ID] = portainer.RegistryAccessPolicies{
				UserAccessPolicies: filteredUserAccessPolicies,
				TeamAccessPolicies: filteredTeamAccessPolicies,
				Namespaces:         []string{},
			}
		}
		m.registryService.UpdateRegistry(registry.ID, &registry)
	}
	return nil
}

func (m *Migrator) UpdateDockerhubToDB30() error {
	dockerhub, err := m.dockerhubService.DockerHub()
	if err == errors.ErrObjectNotFound {
		return nil
	} else if err != nil {
		return err
	}

	if dockerhub.Authentication {
		registry := &portainer.Registry{
			Type:             portainer.DockerHubRegistry,
			Name:             "Dockerhub (authenticated - migrated)",
			URL:              "docker.io",
			Authentication:   true,
			Username:         dockerhub.Username,
			Password:         dockerhub.Password,
			RegistryAccesses: portainer.RegistryAccesses{},
		}

		endpoints, err := m.endpointService.Endpoints()
		if err != nil {
			return err
		}

		for _, endpoint := range endpoints {

			if endpoint.Type != portainer.KubernetesLocalEnvironment &&
				endpoint.Type != portainer.AgentOnKubernetesEnvironment &&
				endpoint.Type != portainer.EdgeAgentOnKubernetesEnvironment {

				userAccessPolicies := portainer.UserAccessPolicies{}
				for userId, _ := range endpoint.UserAccessPolicies {
					if _, found := endpoint.UserAccessPolicies[userId]; found {
						userAccessPolicies[userId] = portainer.AccessPolicy{
							RoleID: 0,
						}
					}
				}

				teamAccessPolicies := portainer.TeamAccessPolicies{}
				for teamId, _ := range endpoint.TeamAccessPolicies {
					if _, found := endpoint.TeamAccessPolicies[teamId]; found {
						teamAccessPolicies[teamId] = portainer.AccessPolicy{
							RoleID: 0,
						}
					}
				}

				registry.RegistryAccesses[endpoint.ID] = portainer.RegistryAccessPolicies{
					UserAccessPolicies: userAccessPolicies,
					TeamAccessPolicies: teamAccessPolicies,
					Namespaces:         []string{},
				}
			}
		}

		err = m.registryService.CreateRegistry(registry)
		if err != nil {
			return err
		}

	}

	return nil
}
