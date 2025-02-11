package client

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"

	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/segmentio/encoding/json"
)

var errUnsupportedEnvironmentType = errors.New("environment not supported")

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
	switch endpoint.Type {
	case portainer.AzureEnvironment:
		return nil, errUnsupportedEnvironmentType
	case portainer.AgentOnDockerEnvironment:
		return createAgentClient(endpoint, endpoint.URL, factory.signatureService, nodeName, timeout)
	case portainer.EdgeAgentOnDockerEnvironment:
		tunnelAddr, err := factory.reverseTunnelService.TunnelAddr(endpoint)
		if err != nil {
			return nil, err
		}

		endpointURL := "http://" + tunnelAddr

		return createAgentClient(endpoint, endpointURL, factory.signatureService, nodeName, timeout)
	}

	if strings.HasPrefix(endpoint.URL, "unix://") || strings.HasPrefix(endpoint.URL, "npipe://") {
		return createLocalClient(endpoint)
	}

	return createTCPClient(endpoint, timeout)
}

func createLocalClient(endpoint *portainer.Endpoint) (*client.Client, error) {
	return client.NewClientWithOpts(
		client.WithHost(endpoint.URL),
		client.WithAPIVersionNegotiation(),
	)
}

func CreateClientFromEnv() (*client.Client, error) {
	return client.NewClientWithOpts(
		client.FromEnv,
		client.WithAPIVersionNegotiation(),
	)
}

func CreateSimpleClient() (*client.Client, error) {
	return client.NewClientWithOpts(
		client.WithAPIVersionNegotiation(),
	)
}

func createTCPClient(endpoint *portainer.Endpoint, timeout *time.Duration) (*client.Client, error) {
	httpCli, err := httpClient(endpoint, timeout)
	if err != nil {
		return nil, err
	}

	opts := []client.Opt{
		client.WithHost(endpoint.URL),
		client.WithAPIVersionNegotiation(),
		client.WithHTTPClient(httpCli),
	}

	if nnTransport, ok := httpCli.Transport.(*NodeNameTransport); ok && nnTransport.TLSClientConfig != nil {
		opts = append(opts, client.WithScheme("https"))
	}

	return client.NewClientWithOpts(opts...)
}

func createAgentClient(endpoint *portainer.Endpoint, endpointURL string, signatureService portainer.DigitalSignatureService, nodeName string, timeout *time.Duration) (*client.Client, error) {
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

	opts := []client.Opt{
		client.WithHost(endpointURL),
		client.WithAPIVersionNegotiation(),
		client.WithHTTPClient(httpCli),
		client.WithHTTPHeaders(headers),
	}

	if nnTransport, ok := httpCli.Transport.(*NodeNameTransport); ok && nnTransport.TLSClientConfig != nil {
		opts = append(opts, client.WithScheme("https"))
	}

	return client.NewClientWithOpts(opts...)
}

type NodeNameTransport struct {
	*http.Transport
}

func (t *NodeNameTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	resp, err := t.Transport.RoundTrip(req)
	if err != nil ||
		resp.StatusCode != http.StatusOK ||
		resp.ContentLength == 0 ||
		!strings.HasSuffix(req.URL.Path, "/images/json") {
		return resp, err
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		resp.Body.Close()
		return resp, err
	}

	resp.Body.Close()

	resp.Body = io.NopCloser(bytes.NewReader(body))

	var rs []struct {
		image.Summary
		Portainer struct {
			Agent struct {
				NodeName string
			}
		}
	}

	if err = json.Unmarshal(body, &rs); err != nil {
		return resp, nil
	}

	nodeNames, ok := req.Context().Value("nodeNames").(map[string]string)
	if ok {
		for idx, r := range rs {
			// as there is no way to differentiate the same image available in multiple nodes only by their ID
			// we append the index of the image in the payload response to match the node name later
			// from the image.Summary[] list returned by docker's client.ImageList()
			nodeNames[fmt.Sprintf("%s-%d", r.ID, idx)] = r.Portainer.Agent.NodeName
		}
	}

	return resp, err
}

func httpClient(endpoint *portainer.Endpoint, timeout *time.Duration) (*http.Client, error) {
	transport := &NodeNameTransport{
		Transport: &http.Transport{},
	}

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
