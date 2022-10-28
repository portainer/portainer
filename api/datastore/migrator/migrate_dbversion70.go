package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
)

func (m *Migrator) migrateDBVersionToDB70() error {
	log.Info().Msg("- add IngressAvailabilityPerNamespace field")
	if err := m.updateIngressFieldsForEnvDB70(); err != nil {
		return err
	}

	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		// copy snapshots to new object
		log.Info().Msg("moving snapshots from endpoint to new object")
		snapshot := portainer.Snapshot{EndpointID: endpoint.ID}

		if len(endpoint.Snapshots) > 0 {
			snapshot.Docker = &endpoint.Snapshots[len(endpoint.Snapshots)-1]
		}

		if len(endpoint.Kubernetes.Snapshots) > 0 {
			snapshot.Kubernetes = &endpoint.Kubernetes.Snapshots[len(endpoint.Kubernetes.Snapshots)-1]
		}

		// save new object
		err = m.snapshotService.Create(&snapshot)
		if err != nil {
			return err
		}

		// set to nil old fields
		log.Info().Msg("deleting snapshot from endpoint")
		endpoint.Snapshots = []portainer.DockerSnapshot{}
		endpoint.Kubernetes.Snapshots = []portainer.KubernetesSnapshot{}

		// update endpoint
		err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *Migrator) updateIngressFieldsForEnvDB70() error {
	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		endpoint.Kubernetes.Configuration.IngressAvailabilityPerNamespace = true
		endpoint.Kubernetes.Configuration.AllowNoneIngressClass = false
		endpoint.PostInitMigrations.MigrateIngresses = true

		err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}
	return nil
}
