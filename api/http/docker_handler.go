package http

import (
	"strconv"

	"github.com/portainer/portainer"

	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/gorilla/mux"
	"github.com/orcaman/concurrent-map"
)

// DockerHandler represents an HTTP API handler for proxying requests to the Docker API.
type DockerHandler struct {
	*mux.Router
	Logger          *log.Logger
	EndpointService portainer.EndpointService
	ProxyFactory    ProxyFactory
	proxies         cmap.ConcurrentMap
}

// NewDockerHandler returns a new instance of DockerHandler.
func NewDockerHandler(mw *middleWareService, resourceControlService portainer.ResourceControlService) *DockerHandler {
	h := &DockerHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
		ProxyFactory: ProxyFactory{
			ResourceControlService: resourceControlService,
		},
		proxies: cmap.New(),
	}
	h.PathPrefix("/{id}/").Handler(
		mw.authenticated(http.HandlerFunc(h.proxyRequestsToDockerAPI)))
	return h
}

func checkEndpointAccessControl(endpoint *portainer.Endpoint, userID portainer.UserID) bool {
	for _, authorizedUserID := range endpoint.AuthorizedUsers {
		if authorizedUserID == userID {
			return true
		}
	}
	return false
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
	endpoint, err := handler.EndpointService.Endpoint(endpointID)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	tokenData, err := extractTokenDataFromRequestContext(r)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
	}
	if tokenData.Role != portainer.AdministratorRole && !checkEndpointAccessControl(endpoint, tokenData.ID) {
		Error(w, portainer.ErrEndpointAccessDenied, http.StatusForbidden, handler.Logger)
		return
	}

	var proxy http.Handler
	item, ok := handler.proxies.Get(string(endpointID))
	if !ok {
		proxy, err = handler.createAndRegisterEndpointProxy(endpoint)
		if err != nil {
			Error(w, err, http.StatusBadRequest, handler.Logger)
			return
		}
	} else {
		proxy = item.(http.Handler)
	}
	http.StripPrefix("/"+id, proxy).ServeHTTP(w, r)
}

func (handler *DockerHandler) createAndRegisterEndpointProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	var proxy http.Handler

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

	handler.proxies.Set(string(endpoint.ID), proxy)
	return proxy, nil
}
