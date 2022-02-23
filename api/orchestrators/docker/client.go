package docker

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/docker/docker/client"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
)

var errUnsupportedEnvironmentType = errors.New("Environment not supported")

const (
	defaultDockerRequestTimeout = 60 * time.Second
	dockerClientVersion         = "1.37"
)

// ClientFactory is used to create Docker clients
type ClientFactory struct {
	signatureService     portainer.DigitalSignatureService
	reverseTunnelService portainer.ReverseTunnelService
}

// NewClientFactory returns a new instance of a ClientFactory
func NewClientFactory(signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService) *ClientFactory {
	return &ClientFactory{
		signatureService:     signatureService,
		reverseTunnelService: reverseTunnelService,
	}
}

// CreateClient is a generic function to create a Docker client based on
// a specific environment(endpoint) configuration. The nodeName parameter can be used
// with an agent enabled environment(endpoint) to target a specific node in an agent cluster.
// The underlying http client timeout may be specified, a default value is used otherwise.
func (factory *ClientFactory) CreateClient(endpoint *portainer.Endpoint, nodeName string, timeout *time.Duration) (*client.Client, error) {
	if endpoint.Type == portainer.AzureEnvironment {
		return nil, errUnsupportedEnvironmentType
	} else if endpoint.Type == portainer.AgentOnDockerEnvironment {
		return createAgentClient(endpoint, factory.signatureService, nodeName, timeout)
	} else if endpoint.Type == portainer.EdgeAgentOnDockerEnvironment {
		return createEdgeClient(endpoint, factory.signatureService, factory.reverseTunnelService, nodeName, timeout)
	}

	if strings.HasPrefix(endpoint.URL, "unix://") || strings.HasPrefix(endpoint.URL, "npipe://") {
		return createLocalClient(endpoint)
	}
	return createTCPClient(endpoint, timeout)
}

func createLocalClient(endpoint *portainer.Endpoint) (*client.Client, error) {
	return client.NewClientWithOpts(
		client.WithHost(endpoint.URL),
		client.WithVersion(dockerClientVersion),
	)
}

func createTCPClient(endpoint *portainer.Endpoint, timeout *time.Duration) (*client.Client, error) {
	httpCli, err := httpClient(endpoint, timeout)
	if err != nil {
		return nil, err
	}

	return client.NewClientWithOpts(
		client.WithHost(endpoint.URL),
		client.WithVersion(dockerClientVersion),
		client.WithHTTPClient(httpCli),
	)
}

func createEdgeClient(endpoint *portainer.Endpoint, signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService, nodeName string, timeout *time.Duration) (*client.Client, error) {
	httpCli, err := httpClient(endpoint, timeout)
	if err != nil {
		return nil, err
	}

	signature, err := signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	headers := map[string]string{
		portainer.PortainerAgentPublicKeyHeader: signatureService.EncodedPublicKey(),
		portainer.PortainerAgentSignatureHeader: signature,
	}

	if nodeName != "" {
		headers[portainer.PortainerAgentTargetHeader] = nodeName
	}

	tunnel, err := reverseTunnelService.GetActiveTunnel(endpoint)
	if err != nil {
		return nil, err
	}

	endpointURL := fmt.Sprintf("http://127.0.0.1:%d", tunnel.Port)

	return client.NewClientWithOpts(
		client.WithHost(endpointURL),
		client.WithVersion(dockerClientVersion),
		client.WithHTTPClient(httpCli),
		client.WithHTTPHeaders(headers),
	)
}

func createAgentClient(endpoint *portainer.Endpoint, signatureService portainer.DigitalSignatureService, nodeName string, timeout *time.Duration) (*client.Client, error) {
	httpCli, err := httpClient(endpoint, timeout)
	if err != nil {
		return nil, err
	}

	signature, err := signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	headers := map[string]string{
		portainer.PortainerAgentPublicKeyHeader: signatureService.EncodedPublicKey(),
		portainer.PortainerAgentSignatureHeader: signature,
	}

	if nodeName != "" {
		headers[portainer.PortainerAgentTargetHeader] = nodeName
	}

	return client.NewClientWithOpts(
		client.WithHost(endpoint.URL),
		client.WithVersion(dockerClientVersion),
		client.WithHTTPClient(httpCli),
		client.WithHTTPHeaders(headers),
	)
}

func httpClient(endpoint *portainer.Endpoint, timeout *time.Duration) (*http.Client, error) {
	transport := &http.Transport{}

	if endpoint.TLSConfig.TLS {
		tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig.TLSCACertPath, endpoint.TLSConfig.TLSCertPath, endpoint.TLSConfig.TLSKeyPath, endpoint.TLSConfig.TLSSkipVerify)
		if err != nil {
			return nil, err
		}
		transport.TLSClientConfig = tlsConfig
	}

	clientTimeout := defaultDockerRequestTimeout
	if timeout != nil {
		clientTimeout = *timeout
	}

	return &http.Client{
		Transport: transport,
		Timeout:   clientTimeout,
	}, nil
}
