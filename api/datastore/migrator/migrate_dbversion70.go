package migrator

import "github.com/rs/zerolog/log"

func (m *Migrator) migrateDBVersionToDB70() error {
	log.Info().Msg("- add IngressAvailabilityPerNamespace field")
	if err := m.addIngressAvailabilityPerNamespaceFieldDB70(); err != nil {
		return err
	}

	return nil
}

func (m *Migrator) addIngressAvailabilityPerNamespaceFieldDB70() error {

	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		endpoint.Kubernetes.Configuration.IngressAvailabilityPerNamespace = true
		err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}
	return nil
}
