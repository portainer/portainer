package utils

import (
	"fmt"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
	portaineree "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerconsts "github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/http/security"
)

type StackViewModel struct {
	InternalStack *portaineree.Stack

	ID         portainer.StackID
	Name       string
	IsExternal bool
	Type       portainer.StackType
}

// GetDockerStacks retrieves all the stacks associated to a specific environment filtered by the user's access.
func GetDockerStacks(tx dataservices.DataStoreTx, securityContext *security.RestrictedRequestContext, environmentID portainer.EndpointID, containers []types.Container, services []swarm.Service) ([]StackViewModel, error) {

	stacks, err := tx.Stack().ReadAll()
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve stacks: %w", err)
	}

	stacksNameSet := map[string]*StackViewModel{}

	for i := range stacks {
		stack := stacks[i]
		if stack.EndpointID == environmentID {
			stacksNameSet[stack.Name] = &StackViewModel{
				InternalStack: &stack,
				ID:            stack.ID,
				Name:          stack.Name,
				IsExternal:    false,
				Type:          stack.Type,
			}
		}
	}

	for _, container := range containers {
		name := container.Labels[dockerconsts.ComposeStackNameLabel]

		if name != "" && stacksNameSet[name] == nil && !isHiddenStack(container.Labels) {
			stacksNameSet[name] = &StackViewModel{
				Name:       name,
				IsExternal: true,
				Type:       portainer.DockerComposeStack,
			}
		}
	}

	for _, service := range services {
		name := service.Spec.Labels[dockerconsts.SwarmStackNameLabel]

		if name != "" && stacksNameSet[name] == nil && !isHiddenStack(service.Spec.Labels) {
			stacksNameSet[name] = &StackViewModel{
				Name:       name,
				IsExternal: true,
				Type:       portainer.DockerSwarmStack,
			}
		}
	}

	stacksList := make([]StackViewModel, 0)
	for _, stack := range stacksNameSet {
		stacksList = append(stacksList, *stack)
	}

	return FilterByResourceControl(tx, stacksList, portainer.StackResourceControl, securityContext, func(c StackViewModel) string {
		return c.Name
	})
}

func isHiddenStack(labels map[string]string) bool {
	return labels[dockerconsts.HideStackLabel] != ""
}
