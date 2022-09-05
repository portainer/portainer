package migrator

import (
	portainer "github.com/portainer/portainer/api"
)

func (m *Migrator) migrateDBVersionToDB70() error {
	// foreach endpoint
	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		// copy snapshots to new object
		migrateLog.Info("- moving snapshots from endpoint to new object")
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
		migrateLog.Info("- deleting snapshot from endpoint")
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
