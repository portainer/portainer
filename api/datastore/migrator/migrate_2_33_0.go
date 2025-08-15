package migrator

import (
	"github.com/portainer/portainer/api/roar"
)

func (m *Migrator) migrateEdgeGroupEndpointsToRoars_2_33_0() error {
	egs, err := m.edgeGroupService.ReadAll()
	if err != nil {
		return err
	}

	for _, eg := range egs {
		if eg.EndpointIDs.Len() == 0 {
			eg.EndpointIDs = roar.FromSlice(eg.Endpoints)
			eg.Endpoints = nil
		}

		if err := m.edgeGroupService.Update(eg.ID, &eg); err != nil {
			return err
		}
	}

	return nil
}
