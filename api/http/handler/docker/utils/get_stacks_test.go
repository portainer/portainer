package utils

import (
	"testing"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
	portaineree "github.com/portainer/portainer/api"
	dockerconsts "github.com/portainer/portainer/api/docker/consts"
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

	datastore := testhelpers.NewDatastore(
		testhelpers.WithEndpoints([]portaineree.Endpoint{*environment}),
		testhelpers.WithStacks([]portaineree.Stack{
			{
				ID:         1,
				Name:       "stack1",
				EndpointID: 1,
			},
			{
				ID:         2,
				Name:       "stack2",
				EndpointID: 2,
			},
		}),
	)

	stacksList, err := GetDockerStacks(datastore, environment.ID, containers, services)
	assert.NoError(t, err)
	assert.Len(t, stacksList, 3)

	expectedStacks := []StackViewModel{
		{
			InternalStack: &portaineree.Stack{
				ID:         1,
				Name:       "stack1",
				EndpointID: 1,
			},
			ID:         1,
			Name:       "stack1",
			IsExternal: false,
			IsOrphaned: false,
		},
		{
			Name:       "stack2",
			IsExternal: true,
			IsOrphaned: false,
		},
		{
			Name:       "stack3",
			IsExternal: true,
			IsOrphaned: false,
		},
	}

	assert.ElementsMatch(t, expectedStacks, stacksList)
}
