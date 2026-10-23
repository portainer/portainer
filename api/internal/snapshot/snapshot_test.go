package snapshot_test

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/snapshot"

	"github.com/stretchr/testify/require"
)

type stubDockerSnapshotter struct {
	snapshot *portainer.DockerSnapshot
	err      error
}

func (s stubDockerSnapshotter) CreateSnapshot(endpoint *portainer.Endpoint) (*portainer.DockerSnapshot, error) {
	return s.snapshot, s.err
}

type stubKubernetesSnapshotter struct {
	snapshot *portainer.KubernetesSnapshot
	err      error
}

func (s stubKubernetesSnapshotter) CreateSnapshot(endpoint *portainer.Endpoint) (*portainer.KubernetesSnapshot, error) {
	return s.snapshot, s.err
}

func newTestService(t *testing.T, dockerSnapshotter portainer.DockerSnapshotter, kubernetesSnapshotter portainer.KubernetesSnapshotter) (*snapshot.Service, *datastore.Store) {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, false)
	service, err := snapshot.NewService("", store, dockerSnapshotter, kubernetesSnapshotter, nil)
	require.NoError(t, err)

	return service, store
}

func TestSnapshotEndpointTx_AzureEnvironment_NoOp(t *testing.T) {
	t.Parallel()

	service, store := newTestService(t, nil, nil)
	endpoint := &portainer.Endpoint{ID: 1, Type: portainer.AzureEnvironment}

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return service.SnapshotEndpointTx(tx, endpoint)
	})
	require.NoError(t, err)

	_, err = store.Snapshot().Read(endpoint.ID)
	require.Error(t, err, "no snapshot should be persisted for an Azure environment")
}

func TestSnapshotEndpointTx_KubernetesLocalEnvironment_PersistsSnapshot(t *testing.T) {
	t.Parallel()

	kubeSnapshot := &portainer.KubernetesSnapshot{}
	service, store := newTestService(t, nil, stubKubernetesSnapshotter{snapshot: kubeSnapshot})
	endpoint := &portainer.Endpoint{ID: 1, Type: portainer.KubernetesLocalEnvironment}

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return service.SnapshotEndpointTx(tx, endpoint)
	})
	require.NoError(t, err)

	persisted, err := store.Snapshot().Read(endpoint.ID)
	require.NoError(t, err)
	require.NotNil(t, persisted.Kubernetes)
}

func TestSnapshotEndpointTx_DockerEnvironment_PersistsSnapshot(t *testing.T) {
	t.Parallel()

	dockerSnapshot := &portainer.DockerSnapshot{}
	service, store := newTestService(t, stubDockerSnapshotter{snapshot: dockerSnapshot}, nil)
	endpoint := &portainer.Endpoint{ID: 1, Type: portainer.DockerEnvironment}

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return service.SnapshotEndpointTx(tx, endpoint)
	})
	require.NoError(t, err)

	persisted, err := store.Snapshot().Read(endpoint.ID)
	require.NoError(t, err)
	require.NotNil(t, persisted.Docker)
}

func TestSnapshotEndpointTx_DockerEnvironment_NilSnapshotNotPersisted(t *testing.T) {
	t.Parallel()

	service, store := newTestService(t, stubDockerSnapshotter{snapshot: nil}, nil)
	endpoint := &portainer.Endpoint{ID: 1, Type: portainer.DockerEnvironment}

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return service.SnapshotEndpointTx(tx, endpoint)
	})
	require.NoError(t, err)

	_, err = store.Snapshot().Read(endpoint.ID)
	require.Error(t, err, "no snapshot should be persisted when the snapshotter returns nil")
}

func TestSnapshotEndpointTx_DockerEnvironment_IncompatibleContainerEngine(t *testing.T) {
	t.Parallel()

	service, store := newTestService(t, stubDockerSnapshotter{snapshot: &portainer.DockerSnapshot{IsPodman: true}}, nil)
	endpoint := &portainer.Endpoint{ID: 1, Type: portainer.DockerEnvironment, ContainerEngine: portainer.ContainerEngineDocker}

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return service.SnapshotEndpointTx(tx, endpoint)
	})
	require.Error(t, err)
}

func TestSnapshotEndpoint_UsesServiceDataStore(t *testing.T) {
	t.Parallel()

	dockerSnapshot := &portainer.DockerSnapshot{}
	service, store := newTestService(t, stubDockerSnapshotter{snapshot: dockerSnapshot}, nil)
	endpoint := &portainer.Endpoint{ID: 1, Type: portainer.DockerEnvironment}

	err := service.SnapshotEndpoint(endpoint)
	require.NoError(t, err)

	persisted, err := store.Snapshot().Read(endpoint.ID)
	require.NoError(t, err)
	require.NotNil(t, persisted.Docker)
}
