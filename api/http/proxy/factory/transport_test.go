package factory

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/docker"
	"github.com/portainer/portainer/pkg/fips"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"

	"github.com/stretchr/testify/require"
)

func init() {
	fips.InitFIPS(false)
}

type stubTunnelService struct{}

func (s *stubTunnelService) StartTunnelServer(addr, port string, snapshotService portainer.SnapshotService) error {
	return nil
}

func (s *stubTunnelService) StopTunnelServer() error { return nil }

func (s *stubTunnelService) GenerateEdgeKey(apiURL, tunnelAddr string, endpointIdentifier int) string {
	return ""
}

func (s *stubTunnelService) Open(endpoint *portainer.Endpoint) error { return nil }

func (s *stubTunnelService) Config(endpointID portainer.EndpointID) portainer.TunnelDetails {
	return portainer.TunnelDetails{}
}

func (s *stubTunnelService) TunnelAddr(endpoint *portainer.Endpoint) (string, error) {
	return "127.0.0.1:9999", nil
}

func (s *stubTunnelService) UpdateLastActivity(endpointID portainer.EndpointID) {}

func (s *stubTunnelService) KeepTunnelAlive(endpointID portainer.EndpointID, ctx context.Context, maxKeepAlive time.Duration) {
}

type staticAllowListService struct {
	parsed portainer.ParsedAllowList
}

func (s *staticAllowListService) ReadParsed(id portainer.AllowListKey) (*portainer.ParsedAllowList, error) {
	return &s.parsed, nil
}

func enableSSRF(t *testing.T) {
	t.Helper()
	parsed := ssrf.ParseAllowedHosts([]string{"example.com"})
	parsed.Mode = portainer.SSRFModeEnforce
	err := ssrf.Configure(&staticAllowListService{parsed: parsed})
	require.NoError(t, err)
	t.Cleanup(func() {
		err := ssrf.Configure(&staticAllowListService{})
		require.NoError(t, err)
	})
}

func TestNewDockerHTTPProxy_NonEdgeNoTLS(t *testing.T) {
	enableSSRF(t)

	f := &ProxyFactory{reverseTunnelService: &stubTunnelService{}}
	endpoint := &portainer.Endpoint{
		Type: portainer.DockerEnvironment,
		URL:  "tcp://192.168.1.100:2376",
	}

	handler, err := f.newDockerHTTPProxy(endpoint)
	require.NoError(t, err)

	proxy := handler.(*httputil.ReverseProxy)
	dt := proxy.Transport.(*docker.Transport)
	require.NotNil(t, dt.HTTPTransport.DialContext)
}

func TestNewDockerHTTPProxy_NonEdgeTLS(t *testing.T) {
	enableSSRF(t)

	f := &ProxyFactory{reverseTunnelService: &stubTunnelService{}}
	endpoint := &portainer.Endpoint{
		Type: portainer.DockerEnvironment,
		URL:  "tcp://192.168.1.100:2376",
		TLSConfig: portainer.TLSConfiguration{
			TLS:           true,
			TLSSkipVerify: true,
		},
	}

	handler, err := f.newDockerHTTPProxy(endpoint)
	require.NoError(t, err)

	proxy := handler.(*httputil.ReverseProxy)
	dt := proxy.Transport.(*docker.Transport)
	require.NotNil(t, dt.HTTPTransport.DialContext)
}

func TestNewDockerHTTPProxy_EdgeNoTLS(t *testing.T) {
	enableSSRF(t)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	f := &ProxyFactory{reverseTunnelService: &stubTunnelService{}}
	endpoint := &portainer.Endpoint{
		Type: portainer.EdgeAgentOnDockerEnvironment,
		URL:  "tcp://192.168.1.100:2376",
	}

	handler, err := f.newDockerHTTPProxy(endpoint)
	require.NoError(t, err)

	proxy := handler.(*httputil.ReverseProxy)
	dt := proxy.Transport.(*docker.Transport)

	resp, err := (&http.Client{Transport: dt.HTTPTransport}).Get(srv.URL)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
}

func TestNewDockerHTTPProxy_EdgeTLS(t *testing.T) {
	enableSSRF(t)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	f := &ProxyFactory{reverseTunnelService: &stubTunnelService{}}
	endpoint := &portainer.Endpoint{
		Type: portainer.EdgeAgentOnDockerEnvironment,
		URL:  "tcp://192.168.1.100:2376",
		TLSConfig: portainer.TLSConfiguration{
			TLS:           true,
			TLSSkipVerify: true,
		},
	}

	handler, err := f.newDockerHTTPProxy(endpoint)
	require.NoError(t, err)

	proxy := handler.(*httputil.ReverseProxy)
	dt := proxy.Transport.(*docker.Transport)

	resp, err := (&http.Client{Transport: dt.HTTPTransport}).Get(srv.URL)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
}

func TestNewAgentProxy_NonEdgeNoTLS(t *testing.T) {
	f := &ProxyFactory{reverseTunnelService: &stubTunnelService{}}
	endpoint := &portainer.Endpoint{
		Type: portainer.AgentOnDockerEnvironment,
		URL:  "tcp://192.168.1.100:9001",
	}

	proxyServer, err := f.NewAgentProxy(endpoint)
	require.NoError(t, err)
	defer proxyServer.Close()

	require.Positive(t, proxyServer.Port)
}

func TestNewAgentProxy_NonEdgeTLS(t *testing.T) {
	f := &ProxyFactory{reverseTunnelService: &stubTunnelService{}}
	endpoint := &portainer.Endpoint{
		Type: portainer.AgentOnDockerEnvironment,
		URL:  "tcp://192.168.1.100:9001",
		TLSConfig: portainer.TLSConfiguration{
			TLS:           true,
			TLSSkipVerify: true,
		},
	}

	proxyServer, err := f.NewAgentProxy(endpoint)
	require.NoError(t, err)
	defer proxyServer.Close()

	require.Positive(t, proxyServer.Port)
}

func TestNewAgentProxy_EdgeNoTLS(t *testing.T) {
	f := &ProxyFactory{reverseTunnelService: &stubTunnelService{}}
	endpoint := &portainer.Endpoint{
		Type: portainer.EdgeAgentOnDockerEnvironment,
		URL:  "tcp://192.168.1.100:9001",
	}

	proxyServer, err := f.NewAgentProxy(endpoint)
	require.NoError(t, err)
	defer proxyServer.Close()

	require.Positive(t, proxyServer.Port)
}

func TestNewAgentProxy_EdgeTLS(t *testing.T) {
	f := &ProxyFactory{reverseTunnelService: &stubTunnelService{}}
	endpoint := &portainer.Endpoint{
		Type: portainer.EdgeAgentOnDockerEnvironment,
		URL:  "tcp://192.168.1.100:9001",
		TLSConfig: portainer.TLSConfiguration{
			TLS:           true,
			TLSSkipVerify: true,
		},
	}

	proxyServer, err := f.NewAgentProxy(endpoint)
	require.NoError(t, err)
	defer proxyServer.Close()

	require.Positive(t, proxyServer.Port)
}
