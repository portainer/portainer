package utils

import (
	"testing"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/http/security"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHandler_getDockerStacks(t *testing.T) {
	t.Parallel()
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
				consts.ComposeStackNameLabel: "stack1",
			},
		},
		{
			Labels: map[string]string{
				consts.ComposeStackNameLabel:        "stack2",
				"io.portainer.accesscontrol.public": "true",
			},
		},
	}

	services := []swarm.Service{
		{
			Spec: swarm.ServiceSpec{
				Annotations: swarm.Annotations{
					Labels: map[string]string{
						consts.SwarmStackNameLabel: "stack3",
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

	ok, store := datastore.MustNewTestStore(t, false, false)
	is.True(ok)

	is.NoError(store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		is.NoError(tx.Endpoint().Create(environment))
		is.NoError(tx.Stack().Create(&stack1))
		is.NoError(tx.Stack().Create(&portainer.Stack{
			ID:         2,
			Name:       "stack2", // stack 2 on env 2
			EndpointID: 2,
			Type:       portainer.DockerSwarmStack,
		}))
		is.NoError(tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		is.NoError(tx.User().Create(&portainer.User{ID: 2, Role: portainer.StandardUserRole}))
		return nil
	}))

	// testing admin user
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
				Labels: map[string]string{
					consts.ComposeStackNameLabel:        "stack2",
					"io.portainer.accesscontrol.public": "true",
				},
			},
			{
				Name:       "stack3",
				IsExternal: true,
				Type:       portainer.DockerSwarmStack,
				Labels: map[string]string{
					consts.SwarmStackNameLabel: "stack3",
				},
			},
		}

		assert.ElementsMatch(t, expectedStacks, stacksList)
		return nil
	}))

	// testing standard user
	is.NoError(store.ViewTx(func(tx dataservices.DataStoreTx) error {
		stacksList, err := GetDockerStacks(tx, &security.RestrictedRequestContext{
			IsAdmin: false,
			UserID:  2,
		}, environment.ID, containers, services)
		require.NoError(t, err)
		assert.Len(t, stacksList, 1)

		expectedStacks := []StackViewModel{
			{
				Name:       "stack2",
				IsExternal: true,
				Type:       portainer.DockerComposeStack,
				Labels: map[string]string{
					consts.ComposeStackNameLabel:        "stack2",
					"io.portainer.accesscontrol.public": "true",
				},
			},
		}

		assert.ElementsMatch(t, expectedStacks, stacksList)
		return nil
	}))

}
