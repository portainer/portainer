package proxy

import (
	"net/http"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type stubHandler struct{}

func (*stubHandler) ServeHTTP(http.ResponseWriter, *http.Request) {}

func TestCreateAndRegisterEndpointProxy_ProxyFactoryNotInitialized(t *testing.T) {
	t.Parallel()

	manager := NewManager(nil)
	endpoint := &portainer.Endpoint{ID: 1}

	proxy, err := manager.CreateAndRegisterEndpointProxy(endpoint)

	require.Error(t, err)
	require.ErrorIs(t, err, ErrProxyFactoryNotInitialized)
	assert.Nil(t, proxy)
}

func TestCreateAgentProxyServer_ProxyFactoryNotInitialized(t *testing.T) {
	t.Parallel()

	manager := NewManager(nil)
	endpoint := &portainer.Endpoint{ID: 1}

	proxyServer, err := manager.CreateAgentProxyServer(endpoint)

	require.Error(t, err)
	require.ErrorIs(t, err, ErrProxyFactoryNotInitialized)
	assert.Nil(t, proxyServer)
}

func TestCreateGitlabProxy_ProxyFactoryNotInitialized(t *testing.T) {
	t.Parallel()

	manager := NewManager(nil)

	proxy, err := manager.CreateGitlabProxy("http://gitlab.example.com")

	require.Error(t, err)
	require.ErrorIs(t, err, ErrProxyFactoryNotInitialized)
	assert.Nil(t, proxy)
}

func TestGetEndpointProxy_NotFound(t *testing.T) {
	t.Parallel()

	manager := NewManager(nil)
	endpoint := &portainer.Endpoint{ID: 1}

	proxy := manager.GetEndpointProxy(endpoint)

	assert.Nil(t, proxy)
}

func TestGetEndpointProxy_Found(t *testing.T) {
	t.Parallel()

	manager := NewManager(nil)
	endpoint := &portainer.Endpoint{ID: 42}
	handler := &stubHandler{}
	manager.endpointProxies.Store(strconv.Itoa(int(endpoint.ID)), handler)

	proxy := manager.GetEndpointProxy(endpoint)

	assert.Same(t, handler, proxy)
}

func TestDeleteEndpointProxy(t *testing.T) {
	t.Parallel()

	manager := NewManager(nil)
	endpoint := &portainer.Endpoint{ID: 7}
	manager.endpointProxies.Store(strconv.Itoa(int(endpoint.ID)), &stubHandler{})

	manager.DeleteEndpointProxy(endpoint.ID)

	proxy := manager.GetEndpointProxy(endpoint)
	assert.Nil(t, proxy)
}
