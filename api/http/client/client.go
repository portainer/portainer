package client

import (
	"crypto/tls"
	"net/http"
	"strings"
	"time"

	"github.com/portainer/portainer"
)

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

	pingOperationURL := strings.Replace(host, "tcp://", scheme+"://", 1) + "/_ping"
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
