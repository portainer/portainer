package migrations

import (
	"github.com/portainer/portainer/api/datastore/migrations/types"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   20,
		Timestamp: 1646090591,
		Up:        v20_up_resource_control_to_22,
		Down:      v20_down_resource_control_to_22,
		Name:      "resource control to 22",
	})
}

func v20_up_resource_control_to_22() error {
	legacyResourceControls, err := migrator.store.ResourceControlService.ResourceControls()
	if err != nil {
		return err
	}

	for _, resourceControl := range legacyResourceControls {
		resourceControl.AdministratorsOnly = false

		err := migrator.store.ResourceControlService.UpdateResourceControl(resourceControl.ID, &resourceControl)
		if err != nil {
			return err
		}
	}

	return nil
}

func v20_down_resource_control_to_22() error {
	return nil
}
