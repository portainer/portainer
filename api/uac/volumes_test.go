package uac

import (
	"testing"

	"github.com/docker/docker/api/types/volume"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/stacks/stackutils"
	"github.com/stretchr/testify/require"
)

func TestVolumeResourceControlGetter(t *testing.T) {
	t.Parallel()
	is := require.New(t)

	ok, store := datastore.MustNewTestStore(t, true, false)
	is.True(ok)
	is.NotNil(store)

	envID := portainer.EndpointID(1)
	dockerID := "docker-id"
	volumeName := "volume"
	volumeRCID := VolumeResourceControlID(volume.Volume{Name: volumeName}, dockerID)
	stackName := "stack"
	stackRCID := stackutils.ResourceControlID(envID, stackName)
	serviceID := "service"

	is.NoError(store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		is.NoError(tx.ResourceControl().Create(authorization.NewPublicResourceControl(volumeRCID, portainer.VolumeResourceControl)))
		is.NoError(tx.ResourceControl().Create(authorization.NewPublicResourceControl(stackRCID, portainer.StackResourceControl)))
		is.NoError(tx.ResourceControl().Create(authorization.NewPublicResourceControl(serviceID, portainer.ServiceResourceControl)))
		return nil
	}))

	is.NoError(store.ViewTx(func(tx dataservices.DataStoreTx) error {
		// by direct ID, keyed by name + docker/swarm cluster ID, matching the Docker proxy's
		// getVolumeResourceID since volume names alone aren't unique across engines
		rc, err := VolumeResourceControlGetter(tx, envID, dockerID)(volume.Volume{Name: volumeName})
		is.NoError(err)
		is.NotNil(rc)
		is.Equal(volumeRCID, rc.ResourceID)

		// a differently-scoped docker/swarm cluster ID must not match the same volume name:
		// the resource ID is scoped to that dockerID, so the lookup misses the stored public
		// RC above and falls back to an empty, non-public restricted control
		otherDockerRCID := VolumeResourceControlID(volume.Volume{Name: volumeName}, "other-docker-id")
		rc, err = VolumeResourceControlGetter(tx, envID, "other-docker-id")(volume.Volume{Name: volumeName})
		is.NoError(err)
		is.NotNil(rc)
		is.Equal(otherDockerRCID, rc.ResourceID)
		is.False(rc.Public)

		// by compose stack label
		rc, err = VolumeResourceControlGetter(tx, envID, dockerID)(
			volume.Volume{Name: "unknown", Labels: map[string]string{consts.ComposeStackNameLabel: stackName}},
		)
		is.NoError(err)
		is.NotNil(rc)
		is.Equal(stackRCID, rc.ResourceID)

		// by swarm stack label
		rc, err = VolumeResourceControlGetter(tx, envID, dockerID)(
			volume.Volume{Name: "unknown", Labels: map[string]string{consts.SwarmStackNameLabel: stackName}},
		)
		is.NoError(err)
		is.NotNil(rc)
		is.Equal(stackRCID, rc.ResourceID)

		// by service ID
		rc, err = VolumeResourceControlGetter(tx, envID, dockerID)(
			volume.Volume{Name: "unknown", Labels: map[string]string{consts.SwarmServiceIDLabel: serviceID}},
		)
		is.NoError(err)
		is.NotNil(rc)
		is.Equal(serviceID, rc.ResourceID)

		return nil
	}))

}
