package migrator

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/stackutils"
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

func (m *Migrator) updateRegistriesToDB27() error {
	registries, err := m.registryService.Registries()
	if err != nil {
		return err
	}

	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		for _, registry := range registries {
			userIDs := []portainer.UserID{}
			for id := range registry.AuthorizedUsers {
				userIDs = append(userIDs, portainer.UserID(id))
			}

			teamIDs := []portainer.TeamID{}
			for id := range registry.AuthorizedTeams {
				teamIDs = append(teamIDs, portainer.TeamID(id))
			}

			resourceControl := authorization.NewRestrictedResourceControl(
				fmt.Sprintf("%d-%d", int(registry.ID), int(endpoint.ID)),
				portainer.RegistryResourceControl,
				userIDs,
				teamIDs,
			)
			m.resourceControlService.CreateResourceControl(resourceControl)
		}
	}
	return nil
}
