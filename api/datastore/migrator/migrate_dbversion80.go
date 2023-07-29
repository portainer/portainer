package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/endpointutils"

	"github.com/rs/zerolog/log"
)

func (m *Migrator) migrateDBVersionToDB80() error {
	if err := m.updateEdgeStackStatusForDB80(); err != nil {
		return err
	}

	if err := m.updateExistingEndpointsToNotDetectMetricsAPIForDB80(); err != nil {
		return err
	}

	if err := m.updateExistingEndpointsToNotDetectStorageAPIForDB80(); err != nil {
		return err
	}

	return nil
}

func (m *Migrator) updateExistingEndpointsToNotDetectMetricsAPIForDB80() error {
	log.Info().Msg("updating existing endpoints to not detect metrics API for existing endpoints (k8s)")

	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		if endpointutils.IsKubernetesEndpoint(&endpoint) {
			endpoint.Kubernetes.Flags.IsServerMetricsDetected = true
			err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func (m *Migrator) updateExistingEndpointsToNotDetectStorageAPIForDB80() error {
	log.Info().Msg("updating existing endpoints to not detect metrics API for existing endpoints (k8s)")

	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		if endpointutils.IsKubernetesEndpoint(&endpoint) {
			endpoint.Kubernetes.Flags.IsServerStorageDetected = true
			err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func (m *Migrator) updateEdgeStackStatusForDB80() error {
	log.Info().Msg("transfer type field to details field for edge stack status")

	edgeStacks, err := m.edgeStackService.EdgeStacks()
	if err != nil {
		return err
	}

	for _, edgeStack := range edgeStacks {
		for endpointId, status := range edgeStack.Status {
			switch status.Type {
			case portainer.EdgeStackStatusPending:
				status.Details.Pending = true
			case portainer.EdgeStackStatusDeploymentReceived:
				status.Details.Ok = true
			case portainer.EdgeStackStatusError:
				status.Details.Error = true
			case portainer.EdgeStackStatusAcknowledged:
				status.Details.Acknowledged = true
			case portainer.EdgeStackStatusRemoved:
				status.Details.Remove = true
			case portainer.EdgeStackStatusRemoteUpdateSuccess:
				status.Details.RemoteUpdateSuccess = true
			}

			edgeStack.Status[endpointId] = status
		}

		err = m.edgeStackService.UpdateEdgeStack(edgeStack.ID, &edgeStack)
		if err != nil {
			return err
		}
	}
	return nil
}
