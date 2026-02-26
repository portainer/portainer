package utils

import (
	"testing"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	dockerconsts "github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/http/security"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHandler_getDockerStacks(t *testing.T) {
	is := require.New(t)

	environment := &portainer.Endpoint{
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

	stack1 := portainer.Stack{
		ID:         1,
		Name:       "stack1",
		EndpointID: 1,
		Type:       portainer.DockerComposeStack,
	}

	ok, store := datastore.MustNewTestStore(t, true, false)
	is.True(ok)

	is.NoError(store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		is.NoError(tx.Endpoint().Create(environment))
		is.NoError(tx.Stack().Create(&stack1))
		is.NoError(tx.Stack().Create(&portainer.Stack{
			ID:         2,
			Name:       "stack2",
			EndpointID: 2,
			Type:       portainer.DockerSwarmStack,
		}))
		is.NoError(tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return nil
	}))

	is.NoError(store.ViewTx(func(tx dataservices.DataStoreTx) error {
		stacksList, err := GetDockerStacks(tx, &security.RestrictedRequestContext{
			IsAdmin: true,
			UserID:  1,
		}, environment.ID, containers, services)
		require.NoError(t, err)
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
		return nil
	}))

}
