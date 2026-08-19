package agent

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/require"
)

func tlsServer(t *testing.T, handler http.HandlerFunc) *httptest.Server {
	t.Helper()
	srv := httptest.NewTLSServer(handler)
	t.Cleanup(srv.Close)

	return srv
}

func TestGetAgentVersionAndPlatform_Success(t *testing.T) {
	t.Parallel()

	srv := tlsServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(portainer.PortainerAgentHeader, "2.19.0")
		w.Header().Set(portainer.HTTPResponseAgentPlatform, "1")
		w.WriteHeader(http.StatusNoContent)
	})

	tlsCfg := srv.Client().Transport.(*http.Transport).TLSClientConfig
	platform, version, err := GetAgentVersionAndPlatform(srv.URL, tlsCfg)
	require.NoError(t, err)
	require.Equal(t, portainer.AgentPlatformDocker, platform)
	require.Equal(t, "2.19.0", version)
}

func TestGetAgentVersionAndPlatform_NonOKStatus(t *testing.T) {
	t.Parallel()

	srv := tlsServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	})

	tlsCfg := srv.Client().Transport.(*http.Transport).TLSClientConfig
	_, _, err := GetAgentVersionAndPlatform(srv.URL, tlsCfg)
	require.Error(t, err)
}

func TestGetAgentVersionAndPlatform_MissingVersionHeader(t *testing.T) {
	t.Parallel()

	srv := tlsServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(portainer.HTTPResponseAgentPlatform, "1")
		w.WriteHeader(http.StatusNoContent)
	})

	tlsCfg := srv.Client().Transport.(*http.Transport).TLSClientConfig
	_, _, err := GetAgentVersionAndPlatform(srv.URL, tlsCfg)
	require.Error(t, err)
}

func TestGetAgentVersionAndPlatform_MissingPlatformHeader(t *testing.T) {
	t.Parallel()

	srv := tlsServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(portainer.PortainerAgentHeader, "2.19.0")
		w.WriteHeader(http.StatusNoContent)
	})

	tlsCfg := srv.Client().Transport.(*http.Transport).TLSClientConfig
	_, _, err := GetAgentVersionAndPlatform(srv.URL, tlsCfg)
	require.Error(t, err)
}

func TestGetAgentVersionAndPlatform_InvalidPlatformZero(t *testing.T) {
	t.Parallel()

	srv := tlsServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(portainer.PortainerAgentHeader, "2.19.0")
		w.Header().Set(portainer.HTTPResponseAgentPlatform, "0")
		w.WriteHeader(http.StatusNoContent)
	})

	tlsCfg := srv.Client().Transport.(*http.Transport).TLSClientConfig
	_, _, err := GetAgentVersionAndPlatform(srv.URL, tlsCfg)
	require.Error(t, err)
}

func TestGetAgentVersionAndPlatform_NonNumericPlatform(t *testing.T) {
	t.Parallel()

	srv := tlsServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(portainer.PortainerAgentHeader, "2.19.0")
		w.Header().Set(portainer.HTTPResponseAgentPlatform, "docker")
		w.WriteHeader(http.StatusNoContent)
	})

	tlsCfg := srv.Client().Transport.(*http.Transport).TLSClientConfig
	_, _, err := GetAgentVersionAndPlatform(srv.URL, tlsCfg)
	require.Error(t, err)
}

func TestGetAgentVersionAndPlatform_PingPathAppended(t *testing.T) {
	t.Parallel()

	var gotPath string
	srv := tlsServer(t, func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		w.Header().Set(portainer.PortainerAgentHeader, "2.19.0")
		w.Header().Set(portainer.HTTPResponseAgentPlatform, strconv.Itoa(int(portainer.AgentPlatformKubernetes)))
		w.WriteHeader(http.StatusNoContent)
	})

	tlsCfg := srv.Client().Transport.(*http.Transport).TLSClientConfig
	_, _, err := GetAgentVersionAndPlatform(srv.URL, tlsCfg)
	require.NoError(t, err)
	require.Equal(t, "/ping", gotPath)
}
