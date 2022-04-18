package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/errors"
	"github.com/portainer/portainer/api/internal/stackutils"
)

func (m *Migrator) updateStackResourceControlToDB27() error {
	migrateLog.Info("- updating stack resource controls")
	resourceControls, err := m.resourceControlService.ResourceControls()
	if err != nil {
		return err
	}

	for _, resource := range resourceControls {
		if resource.Type != portainer.StackResourceControl {
			continue
		}

		stackName := resource.ResourceID

		stack, err := m.stackService.StackByName(stackName)
		if err != nil {
			if err == errors.ErrObjectNotFound {
				continue
			}

			return err
		}

		resource.ResourceID = stackutils.ResourceControlID(stack.EndpointID, stack.Name)

		err = m.resourceControlService.UpdateResourceControl(resource.ID, &resource)
		if err != nil {
			return err
		}
	}

	return nil
}
