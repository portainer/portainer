package proxy

import (
	"errors"
	"net/http"
	"net/url"
)

type gitlabTransport struct {
	httpTransport *http.Transport
}

func newGitlabProxy(uri string) (http.Handler, error) {
	url, err := url.Parse(uri)
	if err != nil {
		return nil, err
	}

	proxy := newSingleHostReverseProxyWithHostHeader(url)
	proxy.Transport = &gitlabTransport{
		httpTransport: &http.Transport{},
	}

	return proxy, nil
}

func (transport *gitlabTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	token := request.Header.Get("Private-Token")
	if token == "" {
		return nil, errors.New("No gitlab token provided")
	}
	r, err := http.NewRequest(request.Method, request.URL.String(), nil)
	if err != nil {
		return nil, err
	}
	r.Header.Set("Private-Token", token)
	return transport.httpTransport.RoundTrip(r)
}
