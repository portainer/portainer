package docker

import (
	"net/http"
	"strings"
	"time"

	"github.com/docker/docker/client"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/crypto"
)

// Snapshotter represents a service used to create endpoint snapshots
type Snapshotter struct {
	signatureService portainer.DigitalSignatureService
}

// NewSnapshotter returns a new Snapshotter instance
func NewSnapshotter(signatureService portainer.DigitalSignatureService) *Snapshotter {
	return &Snapshotter{
		signatureService: signatureService,
	}
}

// TODO: refactor
func (snapshotter *Snapshotter) createClient(endpoint *portainer.Endpoint) (*client.Client, error) {

	if strings.HasPrefix(endpoint.URL, "unix://") {
		return client.NewClientWithOpts(
			client.WithHost(endpoint.URL),
			client.WithVersion(portainer.SupportedDockerAPIVersion),
		)
	}

	transport := &http.Transport{}

	if endpoint.TLSConfig.TLS {
		// HTTPS
		tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig.TLSCACertPath, endpoint.TLSConfig.TLSCertPath, endpoint.TLSConfig.TLSKeyPath, endpoint.TLSConfig.TLSSkipVerify)
		if err != nil {
			return nil, err
		}
		transport.TLSClientConfig = tlsConfig
	}

	httpClient := &http.Client{
		Timeout:   time.Second * 10,
		Transport: transport,
	}

	if endpoint.Type == portainer.AgentOnDockerEnvironment {
		signature, err := snapshotter.signatureService.Sign(portainer.PortainerAgentSignatureMessage)
		if err != nil {
			return nil, err
		}

		headers := map[string]string{
			portainer.PortainerAgentPublicKeyHeader: snapshotter.signatureService.EncodedPublicKey(),
			portainer.PortainerAgentSignatureHeader: signature,
		}

		return client.NewClientWithOpts(
			client.WithHost(endpoint.URL),
			client.WithVersion(portainer.SupportedDockerAPIVersion),
			client.WithHTTPClient(httpClient),
			client.WithHTTPHeaders(headers),
		)
	}

	return client.NewClientWithOpts(
		client.WithHost(endpoint.URL),
		client.WithVersion(portainer.SupportedDockerAPIVersion),
		client.WithHTTPClient(httpClient),
	)
}

// CreateSnapshot creates a snapshot of an endpoint
func (snapshotter *Snapshotter) CreateSnapshot(endpoint *portainer.Endpoint) (*portainer.Snapshot, error) {
	cli, err := snapshotter.createClient(endpoint)
	if err != nil {
		return nil, err
	}

	return snapshot(cli)
}
