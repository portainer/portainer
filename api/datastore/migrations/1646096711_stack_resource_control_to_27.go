package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/errors"
	"github.com/portainer/portainer/api/datastore/migrations/types"
	"github.com/portainer/portainer/api/internal/stackutils"
	"github.com/sirupsen/logrus"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   26,
		Timestamp: 1646096711,
		Up:        v26_up_stack_resource_control_to_27,
		Down:      v26_down_stack_resource_control_to_27,
		Name:      "stack resource control to 27",
	})
}

func v26_up_stack_resource_control_to_27() error {
	logrus.Info("Updating stack resource controls")
	resourceControls, err := migrator.store.ResourceControlService.ResourceControls()
	if err != nil {
		return err
	}

	for _, resource := range resourceControls {
		if resource.Type != portainer.StackResourceControl {
			continue
		}

		stackName := resource.ResourceID

		stack, err := migrator.store.StackService.StackByName(stackName)
		if err != nil {
			if err == errors.ErrObjectNotFound {
				continue
			}

			return err
		}

		resource.ResourceID = stackutils.ResourceControlID(stack.EndpointID, stack.Name)

		err = migrator.store.ResourceControlService.UpdateResourceControl(resource.ID, &resource)
		if err != nil {
			return err
		}
	}

	return nil
}

func v26_down_stack_resource_control_to_27() error {
	return nil
}
