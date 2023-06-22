package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/rs/zerolog/log"
)

func (m *Migrator) updateStackResourceControlToDB27() error {
	log.Info().Msg("updating stack resource controls")

	resourceControls, err := m.resourceControlService.ReadAll()
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
			if dataservices.IsErrObjectNotFound(err) {
				continue
			}

			return err
		}

		resource.ResourceID = stackutils.ResourceControlID(stack.EndpointID, stack.Name)

		err = m.resourceControlService.Update(resource.ID, &resource)
		if err != nil {
			return err
		}
	}

	return nil
}
