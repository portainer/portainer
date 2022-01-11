package gitlab

import (
	"errors"
	"net/http"
)

type Transport struct {
	httpTransport *http.Transport
}

// NewTransport returns a pointer to a new instance of Transport that implements the HTTP Transport
// interface for proxying requests to the Gitlab API.
func NewTransport() *Transport {
	return &Transport{
		httpTransport: &http.Transport{},
	}
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *Transport) RoundTrip(request *http.Request) (*http.Response, error) {
	token := request.Header.Get("Private-Token")
	if token == "" {
		return nil, errors.New("no gitlab token provided")
	}

	r, err := http.NewRequest(request.Method, request.URL.String(), request.Body)
	if err != nil {
		return nil, err
	}

	r.Header.Set("Private-Token", token)
	return transport.httpTransport.RoundTrip(r)
}
