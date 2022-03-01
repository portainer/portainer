package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/errors"
	"github.com/portainer/portainer/api/datastore/migrations/types"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   31,
		Timestamp: 1646097896,
		Up:        v31_up_dockerhub_to_32,
		Down:      v31_down_dockerhub_to_32,
		Name:      "dockerhub to 32",
	})
}

func v31_up_dockerhub_to_32() error {
	dockerhub, err := migrator.store.DockerHubService.DockerHub()
	if err == errors.ErrObjectNotFound {
		return nil
	} else if err != nil {
		return err
	}

	if !dockerhub.Authentication {
		return nil
	}

	registry := &portainer.Registry{
		Type:             portainer.DockerHubRegistry,
		Name:             "Dockerhub (authenticated - migrated)",
		URL:              "docker.io",
		Authentication:   true,
		Username:         dockerhub.Username,
		Password:         dockerhub.Password,
		RegistryAccesses: portainer.RegistryAccesses{},
	}

	// The following code will make this function idempotent.
	// i.e. if run again, it will not change the data.  It will ensure that
	// we only have one migrated registry entry. Duplicates will be removed
	// if they exist and which has been happening due to earlier migration bugs
	migrated := false
	registries, _ := migrator.store.RegistryService.Registries()
	for _, r := range registries {
		if r.Type == registry.Type &&
			r.Name == registry.Name &&
			r.URL == registry.URL &&
			r.Authentication == registry.Authentication {

			if !migrated {
				// keep this one entry
				migrated = true
			} else {
				// delete subsequent duplicates
				migrator.store.RegistryService.DeleteRegistry(portainer.RegistryID(r.ID))
			}
		}
	}

	if migrated {
		return nil
	}

	endpoints, err := migrator.store.EndpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {

		if endpoint.Type != portainer.KubernetesLocalEnvironment &&
			endpoint.Type != portainer.AgentOnKubernetesEnvironment &&
			endpoint.Type != portainer.EdgeAgentOnKubernetesEnvironment {

			userAccessPolicies := portainer.UserAccessPolicies{}
			for userId := range endpoint.UserAccessPolicies {
				if _, found := endpoint.UserAccessPolicies[userId]; found {
					userAccessPolicies[userId] = portainer.AccessPolicy{
						RoleID: 0,
					}
				}
			}

			teamAccessPolicies := portainer.TeamAccessPolicies{}
			for teamId := range endpoint.TeamAccessPolicies {
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

	return migrator.store.RegistryService.Create(registry)
}

func v31_down_dockerhub_to_32() error {
	return nil
}
