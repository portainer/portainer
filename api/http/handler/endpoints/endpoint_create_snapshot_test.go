package endpoints

import (
	"context"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/snapshot"

	"github.com/stretchr/testify/require"
)

type fakeSnapshotService struct{}

func (fakeSnapshotService) Start(ctx context.Context)                           {}
func (fakeSnapshotService) SetSnapshotInterval(snapshotInterval string) error   { return nil }
func (fakeSnapshotService) SnapshotEndpoint(endpoint *portainer.Endpoint) error { return nil }
func (fakeSnapshotService) FillSnapshotData(endpoint *portainer.Endpoint, includeRaw bool) error {
	return nil
}

type stubKubernetesSnapshotter struct {
	snapshot *portainer.KubernetesSnapshot
}

func (s stubKubernetesSnapshotter) CreateSnapshot(endpoint *portainer.Endpoint) (*portainer.KubernetesSnapshot, error) {
	return s.snapshot, nil
}

func TestSnapshotAndPersistEndpoint_NonConcreteSnapshotService_ReturnsError(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, false)
	h := &Handler{DataStore: store, SnapshotService: fakeSnapshotService{}}
	endpoint := &portainer.Endpoint{ID: 1, Type: portainer.KubernetesLocalEnvironment}

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		httpErr := h.snapshotAndPersistEndpoint(tx, endpoint)
		if httpErr != nil {
			return httpErr.Err
		}
		return nil
	})
	require.Error(t, err, "a non-concrete SnapshotService implementation must be rejected")
}

func TestSnapshotAndPersistEndpoint_ConcreteSnapshotService_PersistsSnapshot(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, false)
	snapshotService, err := snapshot.NewService("", store, nil, stubKubernetesSnapshotter{snapshot: &portainer.KubernetesSnapshot{}}, nil)
	require.NoError(t, err)

	h := &Handler{DataStore: store, SnapshotService: snapshotService}
	endpoint := &portainer.Endpoint{ID: 1, Type: portainer.KubernetesLocalEnvironment}

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		httpErr := h.snapshotAndPersistEndpoint(tx, endpoint)
		if httpErr != nil {
			return httpErr.Err
		}
		return nil
	})
	require.NoError(t, err)

	persisted, err := store.Snapshot().Read(endpoint.ID)
	require.NoError(t, err)
	require.NotNil(t, persisted.Kubernetes)
}
