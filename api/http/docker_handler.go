package http

import (
	"strconv"

	"github.com/portainer/portainer"

	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/gorilla/mux"
)

// DockerHandler represents an HTTP API handler for proxying requests to the Docker API.
type DockerHandler struct {
	*mux.Router
	Logger            *log.Logger
	middleWareService *middleWareService
	EndpointService   portainer.EndpointService
	ProxyFactory      ProxyFactory
	proxies           map[portainer.EndpointID]http.Handler
}

// NewDockerHandler returns a new instance of DockerHandler.
func NewDockerHandler(middleWareService *middleWareService, resourceControlService portainer.ResourceControlService) *DockerHandler {
	h := &DockerHandler{
		Router:            mux.NewRouter(),
		Logger:            log.New(os.Stderr, "", log.LstdFlags),
		middleWareService: middleWareService,
		ProxyFactory: ProxyFactory{
			ResourceControlService: resourceControlService,
		},
		proxies: make(map[portainer.EndpointID]http.Handler),
	}
	h.PathPrefix("/{id}/").Handler(middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.proxyRequestsToDockerAPI(w, r)
	})))
	return h
}

func (handler *DockerHandler) proxyRequestsToDockerAPI(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	parsedID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpointID := portainer.EndpointID(parsedID)
	proxy := handler.proxies[endpointID]
	if proxy == nil {
		proxy, err = handler.createAndRegisterEndpointProxy(endpointID)
		if err != nil {
			Error(w, err, http.StatusBadRequest, handler.Logger)
			return
		}
	}
	http.StripPrefix("/"+id, proxy).ServeHTTP(w, r)
}

func (handler *DockerHandler) createAndRegisterEndpointProxy(endpointID portainer.EndpointID) (http.Handler, error) {
	var proxy http.Handler

	endpoint, err := handler.EndpointService.Endpoint(endpointID)
	if err != nil {
		return nil, err
	}

	endpointURL, err := url.Parse(endpoint.URL)
	if err != nil {
		return nil, err
	}

	if endpointURL.Scheme == "tcp" {
		if endpoint.TLS {
			proxy, err = handler.ProxyFactory.newHTTPSProxy(endpointURL, endpoint)
			if err != nil {
				return nil, err
			}
		} else {
			proxy = handler.ProxyFactory.newHTTPProxy(endpointURL)
		}
	} else {
		// Assume unix:// scheme
		proxy = handler.ProxyFactory.newSocketProxy(endpointURL.Path)
	}

	handler.proxies[endpointID] = proxy
	return proxy, nil
}
