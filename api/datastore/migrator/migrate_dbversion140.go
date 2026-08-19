package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/rs/zerolog/log"
)

// migrateRegistryAccessSASecrets_2_40_0 marks Kubernetes endpoints that have
// registry access configured so that imagePullSecrets can be added to their
// default ServiceAccounts during the post-init migration phase (when cluster
// access is available).
func (m *Migrator) migrateRegistryAccessSASecrets_2_40_0() error {
	log.Info().Msg("migrating registry access service account secrets")

	registries, err := m.registryService.ReadAll()
	if err != nil {
		return err
	}

	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	// Collect the IDs of endpoints that have at least one registry with
	// non-empty namespace access - these need the SA imagePullSecrets migration.
	needsMigration := make(map[portainer.EndpointID]bool)
	for _, registry := range registries {
		for endpointID, access := range registry.RegistryAccesses {
			if len(access.Namespaces) > 0 {
				needsMigration[endpointID] = true
			}
		}
	}

	for i := range endpoints {
		endpoint := &endpoints[i]

		if !endpointutils.IsKubernetesEndpoint(endpoint) {
			continue
		}

		if !needsMigration[endpoint.ID] {
			continue
		}

		endpoint.PostInitMigrations.MigrateRegistrySASecrets = true
		if err := m.endpointService.UpdateEndpoint(endpoint.ID, endpoint); err != nil {
			log.Warn().
				Err(err).
				Int("endpointID", int(endpoint.ID)).
				Msg("failed to set registry SA secret migration flag for endpoint")
		}
	}

	return nil
}
