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

// HTTPClient represents a client to send HTTP requests.
type HTTPClient struct {
	*http.Client
}

// NewHTTPClient is used to build a new HTTPClient.
func NewHTTPClient() *HTTPClient {
	return &HTTPClient{
		&http.Client{
			Timeout: time.Second * 5,
		},
	}
}

// AzureAuthenticationResponse represents an Azure API authentication response.
type AzureAuthenticationResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresOn   string `json:"expires_on"`
}

// ExecuteAzureAuthenticationRequest is used to execute an authentication request
// against the Azure API. It re-uses the same http.Client.
func (client *HTTPClient) ExecuteAzureAuthenticationRequest(credentials *portainer.AzureCredentials) (*AzureAuthenticationResponse, error) {
	loginURL := fmt.Sprintf("https://login.microsoftonline.com/%s/oauth2/token", credentials.TenantID)
	params := url.Values{
		"grant_type":    {"client_credentials"},
		"client_id":     {credentials.ApplicationID},
		"client_secret": {credentials.AuthenticationKey},
		"resource":      {"https://management.azure.com/"},
	}

	response, err := client.PostForm(loginURL, params)
	if err != nil {
		return nil, err
	}

	if response.StatusCode != http.StatusOK {
		return nil, portainer.ErrAzureInvalidCredentials
	}

	var token AzureAuthenticationResponse
	err = json.NewDecoder(response.Body).Decode(&token)
	if err != nil {
		return nil, err
	}

	return &token, nil
}

// ExecutePingOperationFromEndpoint will send a SystemPing operation HTTP request to a Docker environment
// using the specified endpoint configuration. It is used exclusively when
// specifying an endpoint from the CLI via the -H flag.
// It uses a new Http.Client for each operation.
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

// ExecutePingOperation will send a SystemPing operation HTTP request to a Docker environment
// using the specified host and optional TLS configuration.
// It uses a new Http.Client for each operation.
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
