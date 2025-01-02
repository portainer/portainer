package utils

import (
	"testing"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
	portaineree "github.com/portainer/portainer/api"
	dockerconsts "github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func TestHandler_getDockerStacks(t *testing.T) {
	environment := &portaineree.Endpoint{
		ID: 1,
		SecuritySettings: portainer.EndpointSecuritySettings{
			AllowStackManagementForRegularUsers: true,
		},
	}

	containers := []types.Container{
		{
			Labels: map[string]string{
				dockerconsts.ComposeStackNameLabel: "stack1",
			},
		},
		{
			Labels: map[string]string{
				dockerconsts.ComposeStackNameLabel: "stack2",
			},
		},
	}

	services := []swarm.Service{
		{
			Spec: swarm.ServiceSpec{
				Annotations: swarm.Annotations{
					Labels: map[string]string{
						dockerconsts.SwarmStackNameLabel: "stack3",
					},
				},
			},
		},
	}

	stack1 := portaineree.Stack{
		ID:         1,
		Name:       "stack1",
		EndpointID: 1,
		Type:       portainer.DockerComposeStack,
	}

	datastore := testhelpers.NewDatastore(
		testhelpers.WithEndpoints([]portaineree.Endpoint{*environment}),
		testhelpers.WithStacks([]portaineree.Stack{
			stack1,
			{
				ID:         2,
				Name:       "stack2",
				EndpointID: 2,
				Type:       portainer.DockerSwarmStack,
			},
		}),
	)

	stacksList, err := GetDockerStacks(datastore, &security.RestrictedRequestContext{
		IsAdmin: true,
	}, environment.ID, containers, services)
	assert.NoError(t, err)
	assert.Len(t, stacksList, 3)

	expectedStacks := []StackViewModel{
		{
			InternalStack: &stack1,
			ID:            1,
			Name:          "stack1",
			IsExternal:    false,
			Type:          portainer.DockerComposeStack,
		},
		{
			Name:       "stack2",
			IsExternal: true,
			Type:       portainer.DockerComposeStack,
		},
		{
			Name:       "stack3",
			IsExternal: true,
			Type:       portainer.DockerSwarmStack,
		},
	}

	assert.ElementsMatch(t, expectedStacks, stacksList)
}
