package factory

import (
	"net/http"
	"net/url"

	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"

	portainer "github.com/portainer/portainer/api"
)

func (factory *ProxyFactory) newKubernetesProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	switch endpoint.Type {
	case portainer.KubernetesLocalEnvironment:
		return factory.newKubernetesLocalProxy(endpoint)
	case portainer.EdgeAgentOnKubernetesEnvironment:
		return factory.newKubernetesEdgeHTTPProxy(endpoint)
	}

	return factory.newKubernetesAgentHTTPSProxy(endpoint)
}

func (factory *ProxyFactory) newKubernetesLocalProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	remoteURL, err := url.Parse(endpoint.URL)
	if err != nil {
		return nil, err
	}

	kubecli, err := factory.kubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return nil, err
	}

	tokenCache := factory.kubernetesTokenCacheManager.GetOrCreateTokenCache(endpoint.ID)
	tokenManager, err := kubernetes.NewTokenManager(kubecli, factory.dataStore, tokenCache, true)
	if err != nil {
		return nil, err
	}

	transport, err := kubernetes.NewLocalTransport(tokenManager, endpoint, factory.kubernetesClientFactory, factory.dataStore, factory.jwtService)
	if err != nil {
		return nil, err
	}

	proxy := NewSingleHostReverseProxyWithHostHeader(remoteURL)
	proxy.Transport = transport

	return proxy, nil
}

func (factory *ProxyFactory) newKubernetesEdgeHTTPProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	tunnelAddr, err := factory.reverseTunnelService.TunnelAddr(endpoint)
	if err != nil {
		return nil, err
	}
	rawURL := "http://" + tunnelAddr

	endpointURL, err := url.Parse(rawURL)
	if err != nil {
		return nil, err
	}

	kubecli, err := factory.kubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return nil, err
	}

	tokenCache := factory.kubernetesTokenCacheManager.GetOrCreateTokenCache(endpoint.ID)
	tokenManager, err := kubernetes.NewTokenManager(kubecli, factory.dataStore, tokenCache, false)
	if err != nil {
		return nil, err
	}

	endpointURL.Scheme = "http"
	proxy := NewSingleHostReverseProxyWithHostHeader(endpointURL)
	proxy.Transport = kubernetes.NewEdgeTransport(factory.dataStore, factory.signatureService, factory.reverseTunnelService, endpoint, tokenManager, factory.kubernetesClientFactory, factory.jwtService)

	return proxy, nil
}

func (factory *ProxyFactory) newKubernetesAgentHTTPSProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	endpointURL := "https://" + endpoint.URL
	remoteURL, err := url.Parse(endpointURL)
	if err != nil {
		return nil, err
	}

	remoteURL.Scheme = "https"

	kubecli, err := factory.kubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return nil, err
	}

	tokenCache := factory.kubernetesTokenCacheManager.GetOrCreateTokenCache(endpoint.ID)
	tokenManager, err := kubernetes.NewTokenManager(kubecli, factory.dataStore, tokenCache, false)
	if err != nil {
		return nil, err
	}

	transport, err := kubernetes.NewAgentTransport(factory.signatureService, tokenManager, endpoint, factory.kubernetesClientFactory, factory.dataStore, factory.jwtService)
	if err != nil {
		return nil, err
	}

	proxy := NewSingleHostReverseProxyWithHostHeader(remoteURL)
	proxy.Transport = transport

	return proxy, nil
}
