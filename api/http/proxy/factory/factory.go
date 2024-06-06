package factory

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"

	"github.com/portainer/portainer/api/kubernetes/cli"
)

const azureAPIBaseURL = "https://management.azure.com"

type (
	// ProxyFactory is a factory to create reverse proxies
	ProxyFactory struct {
		dataStore                   dataservices.DataStore
		signatureService            portainer.DigitalSignatureService
		reverseTunnelService        portainer.ReverseTunnelService
		dockerClientFactory         *dockerclient.ClientFactory
		kubernetesClientFactory     *cli.ClientFactory
		kubernetesTokenCacheManager *kubernetes.TokenCacheManager
		gitService                  portainer.GitService
		snapshotService             portainer.SnapshotService
	}
)

// NewProxyFactory returns a pointer to a new instance of a ProxyFactory
func NewProxyFactory(dataStore dataservices.DataStore, signatureService portainer.DigitalSignatureService, tunnelService portainer.ReverseTunnelService, clientFactory *dockerclient.ClientFactory, kubernetesClientFactory *cli.ClientFactory, kubernetesTokenCacheManager *kubernetes.TokenCacheManager, gitService portainer.GitService, snapshotService portainer.SnapshotService) *ProxyFactory {
	return &ProxyFactory{
		dataStore:                   dataStore,
		signatureService:            signatureService,
		reverseTunnelService:        tunnelService,
		dockerClientFactory:         clientFactory,
		kubernetesClientFactory:     kubernetesClientFactory,
		kubernetesTokenCacheManager: kubernetesTokenCacheManager,
		gitService:                  gitService,
		snapshotService:             snapshotService,
	}
}

// NewEndpointProxy returns a new reverse proxy (filesystem based or HTTP) to an environment(endpoint) API server
func (factory *ProxyFactory) NewEndpointProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	switch endpoint.Type {
	case portainer.AzureEnvironment:
		return newAzureProxy(endpoint, factory.dataStore)
	case portainer.EdgeAgentOnKubernetesEnvironment, portainer.AgentOnKubernetesEnvironment, portainer.KubernetesLocalEnvironment:
		return factory.newKubernetesProxy(endpoint)
	}

	return factory.newDockerProxy(endpoint)
}

// NewGitlabProxy returns a new HTTP proxy to a Gitlab API server
func (factory *ProxyFactory) NewGitlabProxy(gitlabAPIUri string) (http.Handler, error) {
	return newGitlabProxy(gitlabAPIUri)
}
