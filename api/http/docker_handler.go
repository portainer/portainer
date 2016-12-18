package http

import (
	"github.com/portainer/portainer"

	"github.com/gorilla/mux"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
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
	handler.proxy.ServeHTTP(w, r)
}

func (handler *DockerHandler) setupProxy(config *portainer.EndpointConfiguration) error {
	var proxy http.Handler
	endpointURL, err := url.Parse(config.Endpoint)
	if err != nil {
		return err
	}
	if endpointURL.Scheme == "tcp" {
		if config.TLS {
			proxy, err = newHTTPSProxy(endpointURL, config)
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

func newHTTPSProxy(u *url.URL, endpointConfig *portainer.EndpointConfiguration) (http.Handler, error) {
	u.Scheme = "https"
	proxy := httputil.NewSingleHostReverseProxy(u)
	config, err := createTLSConfiguration(endpointConfig.TLSCACertPath, endpointConfig.TLSCertPath, endpointConfig.TLSKeyPath)
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
