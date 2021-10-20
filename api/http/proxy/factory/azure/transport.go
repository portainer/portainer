package azure

import (
	"net/http"
	"path"
	"strconv"
	"sync"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/client"
)

type (
	azureAPIToken struct {
		value          string
		expirationTime time.Time
	}

	Transport struct {
		credentials *portainer.AzureCredentials
		client      *client.HTTPClient
		token       *azureAPIToken
		mutex       sync.Mutex
		dataStore   dataservices.DataStore
		endpoint    *portainer.Endpoint
	}

	azureRequestContext struct {
		isAdmin          bool
		userID           portainer.UserID
		userTeamIDs      []portainer.TeamID
		resourceControls []portainer.ResourceControl
	}
)

// NewTransport returns a pointer to a new instance of Transport that implements the HTTP Transport
// interface for proxying requests to the Azure API.
func NewTransport(credentials *portainer.AzureCredentials, dataStore dataservices.DataStore, endpoint *portainer.Endpoint) *Transport {
	return &Transport{
		credentials: credentials,
		client:      client.NewHTTPClient(),
		dataStore:   dataStore,
		endpoint:    endpoint,
	}
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *Transport) RoundTrip(request *http.Request) (*http.Response, error) {
	return transport.proxyAzureRequest(request)
}

func (transport *Transport) proxyAzureRequest(request *http.Request) (*http.Response, error) {
	requestPath := request.URL.Path

	err := transport.retrieveAuthenticationToken()
	if err != nil {
		return nil, err
	}

	request.Header.Set("Authorization", "Bearer "+transport.token.value)

	if match, _ := path.Match(portainer.AzurePathContainerGroups, requestPath); match {
		return transport.proxyContainerGroupsRequest(request)
	} else if match, _ := path.Match(portainer.AzurePathContainerGroup, requestPath); match {
		return transport.proxyContainerGroupRequest(request)
	}

	return http.DefaultTransport.RoundTrip(request)
}

func (transport *Transport) authenticate() error {
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

func (transport *Transport) retrieveAuthenticationToken() error {
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
