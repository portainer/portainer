package client

import (
	"crypto/tls"
	"net/http"
	"strings"
	"time"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/crypto"
)

// ExecutePingOperationFromEndpoint will send a SystemPing operation HTTP request to a Docker environment
// using the specified endpoint configuration. It is used exclusively when
// specifying an endpoint from the CLI via the -H flag.
func ExecutePingOperationFromEndpoint(endpoint *portainer.Endpoint) (bool, error) {
	if strings.HasPrefix(endpoint.URL, "unix://") {
		return false, nil
	}

	transport := &http.Transport{}

	scheme := "http"

	if endpoint.TLSConfig.TLS {
		tlsConfig, err := crypto.CreateTLSConfiguration(&endpoint.TLSConfig)
		if err != nil {
			return false, err
		}
		scheme = "https"
		transport.TLSClientConfig = tlsConfig
	}

	client := &http.Client{
		Timeout:   time.Second * 3,
		Transport: transport,
	}

	target := strings.Replace(endpoint.URL, "tcp://", scheme+"://", 1)
	return pingOperation(client, target)
}

// ExecutePingOperation will send a SystemPing operation HTTP request to a Docker environment
// using the specified host and optional TLS configuration.
func ExecutePingOperation(host string, tlsConfig *tls.Config) (bool, error) {
	transport := &http.Transport{}

	scheme := "http"
	if tlsConfig != nil {
		transport.TLSClientConfig = tlsConfig
		scheme = "https"
	}

	client := &http.Client{
		Timeout:   time.Second * 3,
		Transport: transport,
	}

	target := strings.Replace(host, "tcp://", scheme+"://", 1)
	return pingOperation(client, target)
}

func pingOperation(client *http.Client, target string) (bool, error) {
	pingOperationURL := target + "/_ping"

	response, err := client.Get(pingOperationURL)
	if err != nil {
		return false, err
	}

	agentOnDockerEnvironment := false
	if response.Header.Get(portainer.PortainerAgentHeader) != "" {
		agentOnDockerEnvironment = true
	}

	return agentOnDockerEnvironment, nil
}
