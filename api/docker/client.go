package docker

import (
	"net/http"
	"strings"
	"time"

	"github.com/docker/docker/client"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/crypto"
)

const (
	unsupportedEnvironmentType = portainer.Error("Environment not supported")
)

// ClientFactory is used to create Docker clients
type ClientFactory struct {
	signatureService portainer.DigitalSignatureService
}

// NewClientFactory returns a new instance of a ClientFactory
func NewClientFactory(signatureService portainer.DigitalSignatureService) *ClientFactory {
	return &ClientFactory{
		signatureService: signatureService,
	}
}

// CreateClient is a generic function to create a Docker client based on
// a specific endpoint configuration
func (factory *ClientFactory) CreateClient(endpoint *portainer.Endpoint) (*client.Client, error) {
	if endpoint.Type == portainer.AzureEnvironment {
		return nil, unsupportedEnvironmentType
	} else if endpoint.Type == portainer.AgentOnDockerEnvironment {
		return createAgentClient(endpoint, factory.signatureService)
	}

	if strings.HasPrefix(endpoint.URL, "unix://") || strings.HasPrefix(endpoint.URL, "npipe://") {
		return createLocalClient(endpoint)
	}
	return createTCPClient(endpoint)
}

func createLocalClient(endpoint *portainer.Endpoint) (*client.Client, error) {
	return client.NewClientWithOpts(
		client.WithHost(endpoint.URL),
		client.WithVersion(portainer.SupportedDockerAPIVersion),
	)
}

func createTCPClient(endpoint *portainer.Endpoint) (*client.Client, error) {
	httpCli, err := httpClient(endpoint)
	if err != nil {
		return nil, err
	}

	return client.NewClientWithOpts(
		client.WithHost(endpoint.URL),
		client.WithVersion(portainer.SupportedDockerAPIVersion),
		client.WithHTTPClient(httpCli),
	)
}

func createAgentClient(endpoint *portainer.Endpoint, signatureService portainer.DigitalSignatureService) (*client.Client, error) {
	httpCli, err := httpClient(endpoint)
	if err != nil {
		return nil, err
	}

	signature, err := signatureService.Sign(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	headers := map[string]string{
		portainer.PortainerAgentPublicKeyHeader: signatureService.EncodedPublicKey(),
		portainer.PortainerAgentSignatureHeader: signature,
	}

	return client.NewClientWithOpts(
		client.WithHost(endpoint.URL),
		client.WithVersion(portainer.SupportedDockerAPIVersion),
		client.WithHTTPClient(httpCli),
		client.WithHTTPHeaders(headers),
	)
}

func httpClient(endpoint *portainer.Endpoint) (*http.Client, error) {
	transport := &http.Transport{}

	if endpoint.TLSConfig.TLS {
		tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig.TLSCACertPath, endpoint.TLSConfig.TLSCertPath, endpoint.TLSConfig.TLSKeyPath, endpoint.TLSConfig.TLSSkipVerify)
		if err != nil {
			return nil, err
		}
		transport.TLSClientConfig = tlsConfig
	}

	return &http.Client{
		Timeout:   time.Second * 10,
		Transport: transport,
	}, nil
}
