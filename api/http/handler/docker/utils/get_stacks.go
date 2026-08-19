package utils

import (
	"fmt"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerconsts "github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/uac"
)

type StackViewModel struct {
	InternalStack *portainer.Stack

	ID         portainer.StackID
	Name       string
	IsExternal bool
	Type       portainer.StackType
	Labels     map[string]string
}

// GetDockerStacks retrieves all the stacks associated to a specific environment filtered by the user's access.
func GetDockerStacks(tx dataservices.DataStoreTx, securityContext *security.RestrictedRequestContext, environmentID portainer.EndpointID, containers []types.Container, services []swarm.Service) ([]StackViewModel, error) {
	stacks, err := tx.Stack().ReadAll()
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve stacks: %w", err)
	}

	user, err := tx.User().Read(securityContext.UserID)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve user: %w", err)
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
				Labels:     container.Labels,
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
				Labels:     service.Spec.Labels,
			}
		}
	}

	stacksList := make([]StackViewModel, 0)
	for _, stack := range stacksNameSet {
		stacksList = append(stacksList, *stack)
	}

	return uac.FilterByResourceControl(stacksList, user, securityContext.UserMemberships,
		func(item StackViewModel) (*portainer.ResourceControl, error) {
			if item.InternalStack != nil {
				return uac.StackResourceControlGetter(tx, environmentID)(*item.InternalStack)
			}
			return uac.ExternalStackResourceControlGetter(tx, environmentID)(uac.ExternalStack{Labels: item.Labels})
		},
	)
}

func isHiddenStack(labels map[string]string) bool {
	return labels[dockerconsts.HideStackLabel] != ""
}
