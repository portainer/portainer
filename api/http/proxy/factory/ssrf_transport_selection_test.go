package factory

import (
	"context"
	"net/http"
	"net/http/httputil"
	"reflect"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/docker"
	"github.com/portainer/portainer/pkg/fips"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"

	"github.com/stretchr/testify/require"
)

// defaultDialContextPtr identifies http.DefaultTransport's own DialContext function.
// ssrf.NewTransport overrides DialContext with the SSRF-aware dialer while
// ssrf.NewInternalTransport leaves it untouched, so comparing function pointers
// distinguishes which one produced a given *http.Transport.
func defaultDialContextPtr() uintptr {
	return reflect.ValueOf(http.DefaultTransport.(*http.Transport).DialContext).Pointer()
}

// fakeReverseTunnelService is a minimal portainer.ReverseTunnelService used to
// exercise the edge-endpoint branches of newDockerHTTPProxy and NewAgentProxy
// without standing up a real tunnel.
type fakeReverseTunnelService struct {
	tunnelAddr string
}

func (f *fakeReverseTunnelService) StartTunnelServer(addr, port string, snapshotService portainer.SnapshotService) error {
	return nil
}

func (f *fakeReverseTunnelService) StopTunnelServer() error { return nil }

func (f *fakeReverseTunnelService) GenerateEdgeKey(apiURL, tunnelAddr string, endpointIdentifier int) string {
	return ""
}

func (f *fakeReverseTunnelService) Open(endpoint *portainer.Endpoint) error { return nil }

func (f *fakeReverseTunnelService) Config(endpointID portainer.EndpointID) portainer.TunnelDetails {
	return portainer.TunnelDetails{}
}

func (f *fakeReverseTunnelService) TunnelAddr(endpoint *portainer.Endpoint) (string, error) {
	return f.tunnelAddr, nil
}

func (f *fakeReverseTunnelService) UpdateLastActivity(endpointID portainer.EndpointID) {}

func (f *fakeReverseTunnelService) KeepTunnelAlive(endpointID portainer.EndpointID, ctx context.Context, maxKeepAlive time.Duration) {
}

type testStaticAllowListService struct {
	parsed portainer.ParsedAllowList
}

func (s *testStaticAllowListService) ReadParsed(id portainer.AllowListKey) (*portainer.ParsedAllowList, error) {
	return &s.parsed, nil
}

// configureSSRFForFactory enables SSRF enforcement for the duration of the test so
// that ssrf.NewTransport actually attaches a DialContext, distinguishing it from
// ssrf.NewInternalTransport which never does.
func configureSSRFForFactory(t *testing.T) {
	t.Helper()

	parsed := ssrf.ParseAllowedHosts(nil)
	parsed.Mode = portainer.SSRFModeEnforce

	err := ssrf.Configure(&testStaticAllowListService{parsed: parsed})
	require.NoError(t, err)

	t.Cleanup(func() {
		off := ssrf.ParseAllowedHosts(nil)
		off.Mode = portainer.SSRFModeOff
		err := ssrf.Configure(&testStaticAllowListService{parsed: off})
		require.NoError(t, err)
	})
}

func TestNewDockerHTTPProxy_NonEdgeNonTLS_UsesUserFacingTransport(t *testing.T) {
	configureSSRFForFactory(t)

	factory := &ProxyFactory{}
	endpoint := &portainer.Endpoint{
		Type: portainer.DockerEnvironment,
		URL:  "tcp://192.0.2.1:2375",
	}

	handler, err := factory.newDockerProxy(endpoint)
	require.NoError(t, err)

	rp, ok := handler.(*httputil.ReverseProxy)
	require.True(t, ok)

	dt, ok := rp.Transport.(*docker.Transport)
	require.True(t, ok)
	require.NotEqual(t, defaultDialContextPtr(), reflect.ValueOf(dt.HTTPTransport.DialContext).Pointer())
}

func TestNewDockerHTTPProxy_NonEdgeTLS_UsesUserFacingTransport(t *testing.T) {
	fips.InitFIPS(false)
	configureSSRFForFactory(t)

	factory := &ProxyFactory{}
	endpoint := &portainer.Endpoint{
		Type: portainer.DockerEnvironment,
		URL:  "tcp://192.0.2.1:2375",
		TLSConfig: portainer.TLSConfiguration{
			TLS:           true,
			TLSSkipVerify: true,
		},
	}

	handler, err := factory.newDockerProxy(endpoint)
	require.NoError(t, err)

	rp, ok := handler.(*httputil.ReverseProxy)
	require.True(t, ok)

	dt, ok := rp.Transport.(*docker.Transport)
	require.True(t, ok)
	require.NotEqual(t, defaultDialContextPtr(), reflect.ValueOf(dt.HTTPTransport.DialContext).Pointer())
	require.NotNil(t, dt.HTTPTransport.TLSClientConfig)
}

func TestNewDockerHTTPProxy_EdgeNonTLS_UsesInternalTransport(t *testing.T) {
	configureSSRFForFactory(t)

	factory := &ProxyFactory{
		reverseTunnelService: &fakeReverseTunnelService{tunnelAddr: "127.0.0.1:9001"},
	}
	endpoint := &portainer.Endpoint{
		Type: portainer.EdgeAgentOnDockerEnvironment,
		URL:  "edge://192.0.2.1",
	}

	handler, err := factory.newDockerProxy(endpoint)
	require.NoError(t, err)

	rp, ok := handler.(*httputil.ReverseProxy)
	require.True(t, ok)

	dt, ok := rp.Transport.(*docker.Transport)
	require.True(t, ok)
	require.Equal(t, defaultDialContextPtr(), reflect.ValueOf(dt.HTTPTransport.DialContext).Pointer())
}

func TestNewDockerHTTPProxy_EdgeTLS_UsesInternalTransport(t *testing.T) {
	fips.InitFIPS(false)
	configureSSRFForFactory(t)

	factory := &ProxyFactory{
		reverseTunnelService: &fakeReverseTunnelService{tunnelAddr: "127.0.0.1:9001"},
	}
	endpoint := &portainer.Endpoint{
		Type: portainer.EdgeAgentOnDockerEnvironment,
		URL:  "edge://192.0.2.1",
		TLSConfig: portainer.TLSConfiguration{
			TLS:           true,
			TLSSkipVerify: true,
		},
	}

	handler, err := factory.newDockerProxy(endpoint)
	require.NoError(t, err)

	rp, ok := handler.(*httputil.ReverseProxy)
	require.True(t, ok)

	dt, ok := rp.Transport.(*docker.Transport)
	require.True(t, ok)
	require.Equal(t, defaultDialContextPtr(), reflect.ValueOf(dt.HTTPTransport.DialContext).Pointer())
	require.NotNil(t, dt.HTTPTransport.TLSClientConfig)
}

func TestNewAgentProxy_NonEdgeNonTLS(t *testing.T) {
	configureSSRFForFactory(t)

	factory := &ProxyFactory{}
	endpoint := &portainer.Endpoint{
		Type: portainer.AgentOnDockerEnvironment,
		URL:  "http://192.0.2.1:9001",
	}

	proxyServer, err := factory.NewAgentProxy(endpoint)
	require.NoError(t, err)
	defer proxyServer.Close()

	require.NotZero(t, proxyServer.Port)
}

func TestNewAgentProxy_NonEdgeTLS(t *testing.T) {
	fips.InitFIPS(false)
	configureSSRFForFactory(t)

	factory := &ProxyFactory{}
	endpoint := &portainer.Endpoint{
		Type: portainer.AgentOnDockerEnvironment,
		URL:  "http://192.0.2.1:9001",
		TLSConfig: portainer.TLSConfiguration{
			TLS:           true,
			TLSSkipVerify: true,
		},
	}

	proxyServer, err := factory.NewAgentProxy(endpoint)
	require.NoError(t, err)
	defer proxyServer.Close()

	require.NotZero(t, proxyServer.Port)
}

func TestNewAgentProxy_EdgeNonTLS(t *testing.T) {
	configureSSRFForFactory(t)

	factory := &ProxyFactory{
		reverseTunnelService: &fakeReverseTunnelService{tunnelAddr: "127.0.0.1:9002"},
	}
	endpoint := &portainer.Endpoint{
		Type: portainer.EdgeAgentOnDockerEnvironment,
		URL:  "edge://192.0.2.1",
	}

	proxyServer, err := factory.NewAgentProxy(endpoint)
	require.NoError(t, err)
	defer proxyServer.Close()

	require.NotZero(t, proxyServer.Port)
}

func TestNewAgentProxy_EdgeTLS(t *testing.T) {
	fips.InitFIPS(false)
	configureSSRFForFactory(t)

	factory := &ProxyFactory{
		reverseTunnelService: &fakeReverseTunnelService{tunnelAddr: "127.0.0.1:9002"},
	}
	endpoint := &portainer.Endpoint{
		Type: portainer.EdgeAgentOnDockerEnvironment,
		URL:  "edge://192.0.2.1",
		TLSConfig: portainer.TLSConfiguration{
			TLS:           true,
			TLSSkipVerify: true,
		},
	}

	proxyServer, err := factory.NewAgentProxy(endpoint)
	require.NoError(t, err)
	defer proxyServer.Close()

	require.NotZero(t, proxyServer.Port)
}
