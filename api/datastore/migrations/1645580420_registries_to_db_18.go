package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrations/types"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   17,
		Timestamp: 1645580420,
		Up:        v17_up_registries_to_18,
		Down:      v17_down_registries_to_18,
		Name:      "Registries to 18",
	})
}

func v17_up_registries_to_18() error {
	legacyRegistries, err := migrator.store.RegistryService.Registries()
	if err != nil {
		return err
	}

	for _, registry := range legacyRegistries {
		registry.UserAccessPolicies = make(portainer.UserAccessPolicies)
		for _, userID := range registry.AuthorizedUsers {
			registry.UserAccessPolicies[userID] = portainer.AccessPolicy{}
		}

		registry.TeamAccessPolicies = make(portainer.TeamAccessPolicies)
		for _, teamID := range registry.AuthorizedTeams {
			registry.TeamAccessPolicies[teamID] = portainer.AccessPolicy{}
		}

		err =  migrator.store.RegistryService.UpdateRegistry(registry.ID, &registry)
		if err != nil {
			return err
		}
	}

	return nil
}

func v17_down_registries_to_18() error {
	return nil
}
