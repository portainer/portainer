package gitlab

import (
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/useractivity"
	"github.com/portainer/portainer/api/http/utils"
)

type Transport struct {
	httpTransport     *http.Transport
	userActivityStore portainer.UserActivityStore
}

// NewTransport returns a pointer to a new instance of Transport that implements the HTTP Transport
// interface for proxying requests to the Gitlab API.
func NewTransport(userActivityStore portainer.UserActivityStore) *Transport {
	return &Transport{
		userActivityStore: userActivityStore,
		httpTransport:     &http.Transport{},
	}
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *Transport) RoundTrip(request *http.Request) (*http.Response, error) {
	token := request.Header.Get("Private-Token")
	if token == "" {
		return nil, errors.New("no gitlab token provided")
	}

	r, err := http.NewRequest(request.Method, request.URL.String(), nil)
	if err != nil {
		return nil, err
	}

	r.Header.Set("Private-Token", token)

	body, err := utils.CopyBody(request)
	if err != nil {
		return nil, err
	}

	resp, err := transport.httpTransport.RoundTrip(r)

	// log if request is success
	if err == nil && (200 <= resp.StatusCode && resp.StatusCode < 300) {
		useractivity.LogProxyActivity(transport.userActivityStore, "Portainer", r, body)
	}

	return resp, err
}
