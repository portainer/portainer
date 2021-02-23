package migrator

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
)

func (m *Migrator) updateStackResourceControlToDB27() error {
	resourceControls, err := m.resourceControlService.ResourceControls()
	if err != nil {
		return err
	}

	for _, resource := range resourceControls {
		if resource.Type != portainer.StackResourceControl {
			continue
		}

		stackName := resource.ResourceID
		if err != nil {
			return err
		}

		stack, err := m.stackService.StackByName(stackName)
		if err != nil {
			return err
		}

		resource.ResourceID = fmt.Sprintf("%d_%s", stack.EndpointID, stack.Name)

		err = m.resourceControlService.UpdateResourceControl(resource.ID, &resource)
		if err != nil {
			return err
		}
	}

	return nil
}
