package chisel

import (
	"context"
	"net"
	"net/http"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/require"
)

func TestPingAgentPanic(t *testing.T) {
	endpoint := &portainer.Endpoint{
		ID:   1,
		Type: portainer.EdgeAgentOnDockerEnvironment,
	}

	_, store := datastore.MustNewTestStore(t, true, true)

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

	s.Open(endpoint)
	s.activeTunnels[endpoint.ID].Port = ln.Addr().(*net.TCPAddr).Port

	require.Error(t, s.pingAgent(endpoint.ID))
	require.NoError(t, srv.Shutdown(context.Background()))
	require.ErrorIs(t, <-errCh, http.ErrServerClosed)
}
