package migrator

import portainer "github.com/portainer/portainer/api"

func (m *Migrator) migrateDBVersionToDB60() error {
	if err := m.addGpuInputFieldDB60(); err != nil {
		return err
	}

	return nil
}

func (m *Migrator) addGpuInputFieldDB60() error {
	migrateLog.Info("- add gpu input field")
	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		endpoint.Gpus = []portainer.Pair{}
		err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}

	}

	return nil
}
