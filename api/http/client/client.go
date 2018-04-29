package client

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
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

	if endpoint.TLSConfig.TLS || endpoint.TLSConfig.TLSSkipVerify {
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

type tokenResponse struct {
	AccessToken  string `json:"access_token"`
	ExpiresIn    int    `json:"expires_in"`
	ExpiresOn    int    `json:"expires_on"`
	ExtExpiresIn int    `json:"ext_expires_in"`
	NotBefore    int    `json:"not_before"`
	Resource     string `json:"resource"`
	TokenType    string `json:"token_type"`
}

// $ http --form POST https://login.microsoftonline.com/TENANT_ID/oauth2/token \
// grant_type="client_credentials" \
// client_id=APP_ID \
// client_secret=KEY \
// resource=https://management.azure.com/
// TODO: godoc
func ExecuteAzureAuthenticationRequest(credentials portainer.AzureCredentials) error {
	client := &http.Client{
		Timeout: time.Second * 3,
	}

	loginURL := fmt.Sprintf("https://login.microsoftonline.com/%s/oauth2/token", credentials.TenantID)
	params := url.Values{
		"grant_type":    {"client_credentials"},
		"client_id":     {credentials.ApplicationID},
		"client_secret": {credentials.AuthenticationKey},
		"resource":      {"https://management.azure.com/"},
	}

	response, err := client.PostForm(loginURL, params)
	if err != nil {
		return err
	}

	if response.StatusCode != http.StatusOK {
		return portainer.ErrAzureInvalidCredentials
	}

	var token tokenResponse
	err = json.NewDecoder(response.Body).Decode(token)
	if err != nil {
		return err
	}

	return nil
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
