package client

import (
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/portainer/portainer/api"
)

var errInvalidResponseStatus = errors.New("Invalid response status (expecting 200)")

const (
	defaultHTTPTimeout = 5
)

// HTTPClient represents a client to send HTTP requests.
type HTTPClient struct {
	*http.Client
}

// NewHTTPClient is used to build a new HTTPClient.
func NewHTTPClient() *HTTPClient {
	return &HTTPClient{
		&http.Client{
			Timeout: time.Second * time.Duration(defaultHTTPTimeout),
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
		return nil, errors.New("Invalid Azure credentials")
	}

	var token AzureAuthenticationResponse
	err = json.NewDecoder(response.Body).Decode(&token)
	if err != nil {
		return nil, err
	}

	return &token, nil
}

// Get executes a simple HTTP GET to the specified URL and returns
// the content of the response body. Timeout can be specified via the timeout parameter,
// will default to defaultHTTPTimeout if set to 0.
func Get(url string, timeout int) ([]byte, error) {

	if timeout == 0 {
		timeout = defaultHTTPTimeout
	}

	client := &http.Client{
		Timeout: time.Second * time.Duration(timeout),
	}

	response, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		log.Printf("[ERROR] [http,client] [message: unexpected status code] [status_code: %d]", response.StatusCode)
		return nil, errInvalidResponseStatus
	}

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	return body, nil
}

// ExecutePingOperation will send a SystemPing operation HTTP request to a Docker environment(endpoint)
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
