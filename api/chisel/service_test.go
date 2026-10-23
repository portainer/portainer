package chisel

import (
	"context"
	"errors"
	"net"
	"net/http"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/pkg/fips"

	"github.com/stretchr/testify/require"
)

func init() {
	fips.InitFIPS(false)
}

type mockSnapshotService struct {
	snapshotFn func(endpoint *portainer.Endpoint) error
}

func (m *mockSnapshotService) Start(_ context.Context) {}

func (m *mockSnapshotService) SetSnapshotInterval(_ string) error { return nil }

func (m *mockSnapshotService) SnapshotEndpoint(endpoint *portainer.Endpoint) error {
	if m.snapshotFn != nil {
		return m.snapshotFn(endpoint)
	}

	return nil
}

func (m *mockSnapshotService) FillSnapshotData(_ *portainer.Endpoint, _ bool) error { return nil }

func newEdgeEndpoint(id portainer.EndpointID) *portainer.Endpoint {
	return &portainer.Endpoint{
		ID:          id,
		EdgeID:      "test-edge-id",
		Type:        portainer.EdgeAgentOnDockerEnvironment,
		UserTrusted: true,
	}
}

func TestPingAgentPanic(t *testing.T) {
	t.Parallel()
	endpoint := newEdgeEndpoint(1)

	_, store := datastore.MustNewTestStore(t, false, true)

	s := NewService(store, nil, nil)

	defer func() {
		require.Nil(t, recover())
	}()

	mux := http.NewServeMux()
	mux.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(pingTimeout + 1*time.Second)
	})

	ln, err := net.ListenTCP("tcp", &net.TCPAddr{IP: net.IPv4(127, 0, 0, 1), Port: 0})
	require.NoError(t, err)

	srv := &http.Server{Handler: mux}

	errCh := make(chan error)
	go func() {
		errCh <- srv.Serve(ln)
	}()

	err = s.Open(endpoint)
	require.NoError(t, err)
	s.activeTunnels[endpoint.ID].Port = ln.Addr().(*net.TCPAddr).Port

	require.Error(t, s.pingAgent(endpoint.ID))
	require.NoError(t, srv.Shutdown(t.Context()))
	require.ErrorIs(t, <-errCh, http.ErrServerClosed)
}

func TestOpenDefaultsHasSnapshotToFalse(t *testing.T) {
	t.Parallel()

	endpoint := newEdgeEndpoint(1)
	_, store := datastore.MustNewTestStore(t, false, true)

	s := NewService(store, nil, nil)

	err := s.Open(endpoint)
	require.NoError(t, err)

	require.False(t, s.activeTunnels[endpoint.ID].HasSnapshot)
}

func TestCheckTunnelsSetsHasSnapshotWhenSnapshotExists(t *testing.T) {
	t.Parallel()

	endpoint := newEdgeEndpoint(2)
	_, store := datastore.MustNewTestStore(t, false, true)

	err := store.Endpoint().Create(endpoint)
	require.NoError(t, err)

	snap := &portainer.Snapshot{
		EndpointID: endpoint.ID,
		Docker:     &portainer.DockerSnapshot{},
	}
	err = store.Snapshot().Create(snap)
	require.NoError(t, err)

	s := NewService(store, nil, nil)
	s.activeTunnels[endpoint.ID] = &portainer.TunnelDetails{
		Status:       portainer.EdgeAgentManagementRequired,
		Port:         50003,
		LastActivity: time.Now(),
	}

	s.checkTunnels()

	require.NotNil(t, s.activeTunnels[endpoint.ID], "tunnel must remain open")
	require.True(t, s.activeTunnels[endpoint.ID].HasSnapshot)
}

func TestCheckTunnelsSnapshotsActiveEnvironmentAndKeepsTunnelAlive(t *testing.T) {
	t.Parallel()

	endpoint := newEdgeEndpoint(3)
	_, store := datastore.MustNewTestStore(t, false, true)

	err := store.Endpoint().Create(endpoint)
	require.NoError(t, err)

	snapshotCalled := false
	svc := &mockSnapshotService{
		snapshotFn: func(_ *portainer.Endpoint) error {
			snapshotCalled = true

			return nil
		},
	}

	s := NewService(store, nil, nil)
	s.snapshotService = svc
	s.activeTunnels[endpoint.ID] = &portainer.TunnelDetails{
		Status:       portainer.EdgeAgentManagementRequired,
		Port:         50000,
		LastActivity: time.Now(),
	}

	s.checkTunnels()

	require.True(t, snapshotCalled)
	require.NotNil(t, s.activeTunnels[endpoint.ID], "tunnel must remain open after snapshot")
	require.True(t, s.activeTunnels[endpoint.ID].HasSnapshot)
}

func TestCheckTunnelsKeepsHasSnapshotFalseOnSnapshotFailure(t *testing.T) {
	t.Parallel()

	endpoint := newEdgeEndpoint(4)
	_, store := datastore.MustNewTestStore(t, false, true)

	err := store.Endpoint().Create(endpoint)
	require.NoError(t, err)

	svc := &mockSnapshotService{
		snapshotFn: func(_ *portainer.Endpoint) error {
			return errors.New("snapshot failed")
		},
	}

	s := NewService(store, nil, nil)
	s.snapshotService = svc
	s.activeTunnels[endpoint.ID] = &portainer.TunnelDetails{
		Status:       portainer.EdgeAgentManagementRequired,
		Port:         50001,
		LastActivity: time.Now(),
	}

	s.checkTunnels()

	require.NotNil(t, s.activeTunnels[endpoint.ID], "tunnel must remain open after failed snapshot")
	require.False(t, s.activeTunnels[endpoint.ID].HasSnapshot, "HasSnapshot must stay false after failure")
}

func TestCheckTunnelsClosesStaleEntryForDeletedEndpoint(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	// Endpoint is not created in the store, simulates deletion while tunnel stays open.
	s := NewService(store, nil, nil)
	s.activeTunnels[1] = &portainer.TunnelDetails{
		Status:       portainer.EdgeAgentManagementRequired,
		Port:         50010,
		LastActivity: time.Now(),
	}

	s.checkTunnels()

	require.Nil(t, s.activeTunnels[1], "stale tunnel for deleted endpoint must be removed immediately")
}

func TestCheckTunnelsClosesIdleTunnelAndSnapshots(t *testing.T) {
	t.Parallel()

	endpoint := newEdgeEndpoint(5)
	_, store := datastore.MustNewTestStore(t, false, true)

	err := store.Endpoint().Create(endpoint)
	require.NoError(t, err)

	snapshotCalled := false
	svc := &mockSnapshotService{
		snapshotFn: func(_ *portainer.Endpoint) error {
			snapshotCalled = true

			return nil
		},
	}

	s := NewService(store, nil, nil)
	s.snapshotService = svc
	s.activeTunnels[endpoint.ID] = &portainer.TunnelDetails{
		Status:       portainer.EdgeAgentManagementRequired,
		Port:         50002,
		LastActivity: time.Now().Add(-(activeTimeout + time.Second)),
	}

	s.checkTunnels()

	require.True(t, snapshotCalled)
	require.Nil(t, s.activeTunnels[endpoint.ID], "tunnel must be closed after idle timeout")
}
