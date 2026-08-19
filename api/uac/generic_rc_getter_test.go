package uac

import (
	"testing"

	"github.com/docker/docker/api/types/container"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/stretchr/testify/require"
)

func TestGenericResourcControlGetter(t *testing.T) {
	t.Parallel()
	is := require.New(t)

	ok, store := datastore.MustNewTestStore(t, true, false)
	is.True(ok)
	is.NotNil(store)

	endpointID := portainer.EndpointID(1)
	composeStackName := "compose-stack"
	composeStackRCID := StackResourceControlID(endpointID, composeStackName)
	swarmStackName := "swarm-stack"
	swarmStackRCID := StackResourceControlID(endpointID, swarmStackName)
	serviceID := "service"

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		// created on container create
		is.NoError(tx.ResourceControl().Create(authorization.NewPublicResourceControl("container", portainer.ContainerResourceControl)))
		// created on compose stack create
		is.NoError(tx.ResourceControl().Create(authorization.NewPublicResourceControl(composeStackRCID, portainer.StackResourceControl)))
		// created on swarm stack create
		is.NoError(tx.ResourceControl().Create(authorization.NewPublicResourceControl(swarmStackRCID, portainer.StackResourceControl)))
		// created a swarm service create
		is.NoError(tx.ResourceControl().Create(authorization.NewPublicResourceControl(serviceID, portainer.ServiceResourceControl)))
		return nil
	})
	is.NoError(err)

	err = store.ViewTx(func(tx dataservices.DataStoreTx) error {
		context := ResourceContext[container.Summary]{RCType: portainer.ContainerResourceControl, IDGetter: ContainerResourceControlID, LabelsGetter: ContainerLabels}

		// trying to get UAC for a container created through Portainer
		rc, err := genericResourcControlGetter(tx, 1, context)(container.Summary{ID: "container"})
		is.NoError(err)
		is.NotNil(rc)

		// trying to get UAC for an external container
		rc, err = genericResourcControlGetter(tx, 1, context)(container.Summary{ID: "unknown"})
		is.NoError(err)
		is.NotNil(rc)
		is.Empty(rc.UserAccesses)
		is.Empty(rc.TeamAccesses)

		// trying to get UAC for a container from a compose stack
		rc, err = genericResourcControlGetter(tx, 1, context)(container.Summary{ID: "by-compose-stack-name-label", Labels: map[string]string{consts.ComposeStackNameLabel: composeStackName}})
		is.NoError(err)
		is.NotNil(rc)
		is.Equal(composeStackRCID, rc.ResourceID)

		// trying to get UAC for a container from a swarm stack
		rc, err = genericResourcControlGetter(tx, 1, context)(container.Summary{ID: "by-swarm-stack-name-label", Labels: map[string]string{consts.SwarmStackNameLabel: swarmStackName}})
		is.NoError(err)
		is.NotNil(rc)
		is.Equal(swarmStackRCID, rc.ResourceID)

		// trying to get UAC for a container from a swarm service
		rc, err = genericResourcControlGetter(tx, 1, context)(container.Summary{ID: "by-swarm-service-id-label", Labels: map[string]string{consts.SwarmServiceIDLabel: serviceID}})
		is.NoError(err)
		is.NotNil(rc)
		is.Equal(serviceID, rc.ResourceID)

		return nil
	})

	is.NoError(err)

}

func TestGenericResourcControlGetterWithPortainerLabels(t *testing.T) {
	t.Parallel()
	is := require.New(t)

	ok, store := datastore.MustNewTestStore(t, true, false)
	is.True(ok)
	is.NotNil(store)

	is.NoError(store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		is.NoError(tx.User().Create(&portainer.User{Role: portainer.AdministratorRole, Username: "admin"}))
		is.NoError(tx.User().Create(&portainer.User{Role: portainer.AdministratorRole, Username: "user"}))
		is.NoError(tx.Team().Create(&portainer.Team{Name: "team"}))
		is.NoError(tx.TeamMembership().Create(&portainer.TeamMembership{UserID: 2, TeamID: 1}))
		return nil
	}))

	is.NoError(store.ViewTx(func(tx dataservices.DataStoreTx) error {
		context := ResourceContext[container.Summary]{RCType: portainer.ContainerResourceControl, IDGetter: ContainerResourceControlID, LabelsGetter: ContainerLabels}

		rc, err := genericResourcControlGetter(tx, 1, context)(container.Summary{
			ID:     "public",
			Labels: map[string]string{publicRCLabel: "true"},
		})
		is.NoError(err)
		is.NotNil(rc)
		is.True(rc.Public)

		rc, err = genericResourcControlGetter(tx, 1, context)(container.Summary{
			ID:     "team",
			Labels: map[string]string{teamRCLabel: "team"},
		})
		is.NoError(err)
		is.NotNil(rc)
		is.Contains(rc.TeamAccesses, portainer.TeamResourceAccess{TeamID: 1, AccessLevel: portainer.ReadWriteAccessLevel})

		rc, err = genericResourcControlGetter(tx, 1, context)(container.Summary{
			ID:     "no-team",
			Labels: map[string]string{teamRCLabel: "team2"},
		})
		is.NoError(err)
		is.NotNil(rc)
		is.Empty(rc.UserAccesses)
		is.Empty(rc.TeamAccesses)

		rc, err = genericResourcControlGetter(tx, 1, context)(container.Summary{
			ID:     "user",
			Labels: map[string]string{userRCLabel: "user"},
		})
		is.NoError(err)
		is.NotNil(rc)
		is.Contains(rc.UserAccesses, portainer.UserResourceAccess{UserID: 2, AccessLevel: portainer.ReadWriteAccessLevel})

		rc, err = genericResourcControlGetter(tx, 1, context)(container.Summary{
			ID:     "no-user",
			Labels: map[string]string{userRCLabel: "user2"},
		})
		is.NoError(err)
		is.NotNil(rc)
		is.Empty(rc.UserAccesses)
		is.Empty(rc.TeamAccesses)

		rc, err = genericResourcControlGetter(tx, 1, context)(container.Summary{
			ID:     "warn-on-unknown",
			Labels: map[string]string{userRCLabel: "user2,user3", teamRCLabel: "team2,team3"},
		})
		is.NoError(err)
		is.NotNil(rc)
		is.Empty(rc.UserAccesses)
		is.Empty(rc.TeamAccesses)

		rc, err = genericResourcControlGetter(tx, 1, context)(container.Summary{
			ID: "empty-when-no-label",
		})
		is.NoError(err)
		is.NotNil(rc)
		is.Empty(rc.UserAccesses)
		is.Empty(rc.TeamAccesses)

		rc, err = genericResourcControlGetter(tx, 1, context)(container.Summary{
			ID:     "empty-when-empty-labels",
			Labels: map[string]string{},
		})
		is.NoError(err)
		is.NotNil(rc)
		is.Empty(rc.UserAccesses)
		is.Empty(rc.TeamAccesses)

		return nil
	}))
}
