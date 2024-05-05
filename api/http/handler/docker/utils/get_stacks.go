package utils

import (
	"fmt"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
	portaineree "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerconsts "github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/internal/set"
)

type StackViewModel struct {
	InternalStack *portaineree.Stack

	ID         portainer.StackID
	Name       string
	IsExternal bool
	IsOrphaned bool
}

// GetDockerStacks retrieves all the stacks associated to a specific environment.
func GetDockerStacks(tx dataservices.DataStoreTx, environmentID portainer.EndpointID, containers []types.Container, services []swarm.Service) ([]StackViewModel, error) {

	stacks, err := tx.Stack().ReadAll()
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve stacks: %w", err)
	}

	stacksNameSet := set.Set[string]{}
	stacksList := make([]StackViewModel, 0)

	for i := range stacks {
		stack := stacks[i]
		if stack.EndpointID == environmentID {
			stacksList = append(stacksList, StackViewModel{
				InternalStack: &stack,
				ID:            stack.ID,
				Name:          stack.Name,
				IsExternal:    false,
				IsOrphaned:    false,
			})
			stacksNameSet.Add(stack.Name)
		}
	}

	for _, container := range containers {
		name := container.Labels[dockerconsts.ComposeStackNameLabel]

		if name != "" && !stacksNameSet.Contains(name) && !isHiddenStack(container.Labels) {
			stacksList = append(stacksList, StackViewModel{
				Name:       name,
				IsExternal: true,
				IsOrphaned: false,
			})
			stacksNameSet.Add(name)
		}
	}

	for _, service := range services {
		name := service.Spec.Labels[dockerconsts.SwarmStackNameLabel]

		if name != "" && !stacksNameSet.Contains(name) && !isHiddenStack(service.Spec.Labels) {
			stacksList = append(stacksList, StackViewModel{
				Name:       name,
				IsExternal: true,
				IsOrphaned: false,
			})
			stacksNameSet.Add(name)
		}
	}

	return stacksList, nil
}

func isHiddenStack(labels map[string]string) bool {
	return labels[dockerconsts.HideStackLabel] != ""
}
