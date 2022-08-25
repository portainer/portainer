package agent

import (
	"crypto/tls"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/url"
)

// GetAgentVersionAndPlatform returns the agent version and platform
//
// it sends a ping to the agent and parses the version and platform from the headers
func GetAgentVersionAndPlatform(endpointUrl string, tlsConfig *tls.Config) (portainer.AgentPlatform, string, error) {
	httpCli := &http.Client{
		Timeout: 3 * time.Second,
	}

	if tlsConfig != nil {
		httpCli.Transport = &http.Transport{
			TLSClientConfig: tlsConfig,
		}
	}

	parsedURL, err := url.ParseURL(endpointUrl + "/ping")
	if err != nil {
		return 0, "", err
	}

	parsedURL.Scheme = "https"

	req, err := http.NewRequest(http.MethodGet, parsedURL.String(), nil)
	if err != nil {
		return 0, "", err
	}

	resp, err := httpCli.Do(req)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return 0, "", fmt.Errorf("Failed request with status %d", resp.StatusCode)
	}

	version := resp.Header.Get(portainer.PortainerAgentHeader)
	if version == "" {
		return 0, "", errors.New("Version Header is missing")
	}

	agentPlatformHeader := resp.Header.Get(portainer.HTTPResponseAgentPlatform)
	if agentPlatformHeader == "" {
		return 0, "", errors.New("Agent Platform Header is missing")
	}

	agentPlatformNumber, err := strconv.Atoi(agentPlatformHeader)
	if err != nil {
		return 0, "", err
	}

	if agentPlatformNumber == 0 {
		return 0, "", errors.New("Agent platform is invalid")
	}

	return portainer.AgentPlatform(agentPlatformNumber), version, nil
}
