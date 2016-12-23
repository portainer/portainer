package http

import (
	"github.com/portainer/portainer"

	"io"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"

	"github.com/gorilla/mux"
)

// DockerHandler represents an HTTP API handler for proxying requests to the Docker API.
type DockerHandler struct {
	*mux.Router
	Logger            *log.Logger
	middleWareService *middleWareService
	proxy             http.Handler
}

// NewDockerHandler returns a new instance of DockerHandler.
func NewDockerHandler(middleWareService *middleWareService) *DockerHandler {
	h := &DockerHandler{
		Router:            mux.NewRouter(),
		Logger:            log.New(os.Stderr, "", log.LstdFlags),
		middleWareService: middleWareService,
	}
	h.PathPrefix("/").Handler(middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.proxyRequestsToDockerAPI(w, r)
	})))
	return h
}

func (handler *DockerHandler) proxyRequestsToDockerAPI(w http.ResponseWriter, r *http.Request) {
	if handler.proxy != nil {
		handler.proxy.ServeHTTP(w, r)
	} else {
		Error(w, portainer.ErrNoActiveEndpoint, http.StatusNotFound, handler.Logger)
	}
}

func (handler *DockerHandler) setupProxy(endpoint *portainer.Endpoint) error {
	var proxy http.Handler
	endpointURL, err := url.Parse(endpoint.URL)
	if err != nil {
		return err
	}
	if endpointURL.Scheme == "tcp" {
		if endpoint.TLS {
			proxy, err = newHTTPSProxy(endpointURL, endpoint)
			if err != nil {
				return err
			}
		} else {
			proxy = newHTTPProxy(endpointURL)
		}
	} else {
		// Assume unix:// scheme
		proxy = newSocketProxy(endpointURL.Path)
	}
	handler.proxy = proxy
	return nil
}

func newHTTPProxy(u *url.URL) http.Handler {
	u.Scheme = "http"
	return httputil.NewSingleHostReverseProxy(u)
}

func newHTTPSProxy(u *url.URL, endpoint *portainer.Endpoint) (http.Handler, error) {
	u.Scheme = "https"
	proxy := httputil.NewSingleHostReverseProxy(u)
	config, err := createTLSConfiguration(endpoint.TLSCACertPath, endpoint.TLSCertPath, endpoint.TLSKeyPath)
	if err != nil {
		return nil, err
	}
	proxy.Transport = &http.Transport{
		TLSClientConfig: config,
	}
	return proxy, nil
}

func newSocketProxy(path string) http.Handler {
	return &unixSocketHandler{path}
}

// unixSocketHandler represents a handler to proxy HTTP requests via a unix:// socket
type unixSocketHandler struct {
	path string
}

func (h *unixSocketHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := net.Dial("unix", h.path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	c := httputil.NewClientConn(conn, nil)
	defer c.Close()

	res, err := c.Do(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer res.Body.Close()

	for k, vv := range res.Header {
		for _, v := range vv {
			w.Header().Add(k, v)
		}
	}
	if _, err := io.Copy(w, res.Body); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
