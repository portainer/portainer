package azure

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/client"
)

type (
	azureAPIToken struct {
		value          string
		expirationTime time.Time
	}

	transport struct {
		credentials *portainer.AzureCredentials
		client      *client.HTTPClient
		token       *azureAPIToken
		mutex       sync.Mutex
	}
)

// NewTransport returns a pointer to a new instance of transport that implements the HTTP transport
// interface for proxying requests to the Azure API.
func NewTransport(credentials *portainer.AzureCredentials) *transport {
	return &transport{
		credentials: credentials,
		client:      client.NewHTTPClient(),
	}
}

// RoundTrip is the implementation of the transport interface.
func (transport *transport) RoundTrip(request *http.Request) (*http.Response, error) {
	err := transport.retrieveAuthenticationToken()
	if err != nil {
		return nil, err
	}

	request.Header.Set("Authorization", "Bearer "+transport.token.value)
	return http.DefaultTransport.RoundTrip(request)
}

func (transport *transport) authenticate() error {
	token, err := transport.client.ExecuteAzureAuthenticationRequest(transport.credentials)
	if err != nil {
		return err
	}

	expiresOn, err := strconv.ParseInt(token.ExpiresOn, 10, 64)
	if err != nil {
		return err
	}

	transport.token = &azureAPIToken{
		value:          token.AccessToken,
		expirationTime: time.Unix(expiresOn, 0),
	}

	return nil
}

func (transport *transport) retrieveAuthenticationToken() error {
	transport.mutex.Lock()
	defer transport.mutex.Unlock()

	if transport.token == nil {
		return transport.authenticate()
	}

	timeLimit := time.Now().Add(-5 * time.Minute)
	if timeLimit.After(transport.token.expirationTime) {
		return transport.authenticate()
	}

	return nil
}
