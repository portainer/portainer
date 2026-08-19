package uac

import (
	"testing"

	"github.com/docker/docker/api/types/network"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/stacks/stackutils"
	"github.com/stretchr/testify/require"
)

func TestNetworkResourceControlGetter(t *testing.T) {
	t.Parallel()
	is := require.New(t)

	ok, store := datastore.MustNewTestStore(t, true, false)
	is.True(ok)
	is.NotNil(store)

	envID := portainer.EndpointID(1)
	networkID := "network"
	stackName := "stack"
	stackRCID := stackutils.ResourceControlID(envID, stackName)
	serviceID := "service"

	is.NoError(store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		is.NoError(tx.ResourceControl().Create(authorization.NewPublicResourceControl(networkID, portainer.NetworkResourceControl)))
		is.NoError(tx.ResourceControl().Create(authorization.NewPublicResourceControl(stackRCID, portainer.StackResourceControl)))
		is.NoError(tx.ResourceControl().Create(authorization.NewPublicResourceControl(serviceID, portainer.ServiceResourceControl)))
		return nil
	}))

	is.NoError(store.ViewTx(func(tx dataservices.DataStoreTx) error {
		// by direct ID
		rc, err := NetworkResourceControlGetter(tx, envID)(network.Inspect{ID: networkID})
		is.NoError(err)
		is.NotNil(rc)
		is.Equal(networkID, rc.ResourceID)

		// by compose stack label
		rc, err = NetworkResourceControlGetter(tx, envID)(
			network.Inspect{ID: "unknown", Labels: map[string]string{consts.ComposeStackNameLabel: stackName}},
		)
		is.NoError(err)
		is.NotNil(rc)
		is.Equal(stackRCID, rc.ResourceID)

		// by swarm stack label
		rc, err = NetworkResourceControlGetter(tx, envID)(
			network.Inspect{ID: "unknown", Labels: map[string]string{consts.SwarmStackNameLabel: stackName}},
		)
		is.NoError(err)
		is.NotNil(rc)
		is.Equal(stackRCID, rc.ResourceID)

		// by service ID
		rc, err = NetworkResourceControlGetter(tx, envID)(
			network.Inspect{ID: "unknown", Labels: map[string]string{consts.SwarmServiceIDLabel: serviceID}},
		)
		is.NoError(err)
		is.NotNil(rc)
		is.Equal(serviceID, rc.ResourceID)

		return nil
	}))

}
