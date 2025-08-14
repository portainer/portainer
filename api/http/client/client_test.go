package client

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/fips"

	"github.com/stretchr/testify/require"
)

func TestExecutePingOperationFailure(t *testing.T) {
	fips.InitFIPS(false)

	host := "http://localhost:1"
	config := portainer.TLSConfiguration{
		TLS:           true,
		TLSSkipVerify: true,
	}

	// Invalid host
	ok, err := ExecutePingOperation(host, config)
	require.False(t, ok)
	require.Error(t, err)

	// Invalid TLS configuration
	config.TLSCertPath = "/invalid/path/to/cert"
	config.TLSKeyPath = "/invalid/path/to/key"

	ok, err = ExecutePingOperation(host, config)
	require.False(t, ok)
	require.Error(t, err)

}

func TestPingOperation(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add(portainer.PortainerAgentHeader, "1")
	}))
	defer srv.Close()

	agentOnDockerEnv, err := pingOperation(http.DefaultClient, srv.URL)
	require.NoError(t, err)
	require.True(t, agentOnDockerEnv)
}
