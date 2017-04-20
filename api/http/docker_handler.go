package http

import (
	"strconv"

	"github.com/portainer/portainer"

	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// DockerHandler represents an HTTP API handler for proxying requests to the Docker API.
type DockerHandler struct {
	*mux.Router
	Logger          *log.Logger
	EndpointService portainer.EndpointService
	TeamService     portainer.TeamService
	ProxyService    *ProxyService
}

// NewDockerHandler returns a new instance of DockerHandler.
func NewDockerHandler(mw *middleWareService, resourceControlService portainer.ResourceControlService) *DockerHandler {
	h := &DockerHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.PathPrefix("/{id}/").Handler(
		mw.authenticated(http.HandlerFunc(h.proxyRequestsToDockerAPI)))
	return h
}

func (handler *DockerHandler) checkEndpointAccessControl(endpoint *portainer.Endpoint, userID portainer.UserID) bool {
	for _, authorizedUserID := range endpoint.AuthorizedUsers {
		if authorizedUserID == userID {
			return true
		}
	}

	teams, _ := handler.TeamService.TeamsByUserID(userID)
	for _, authorizedTeamID := range endpoint.AuthorizedTeams {
		for _, team := range teams {
			if team.ID == authorizedTeamID {
				return true
			}
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
	if tokenData.Role != portainer.AdministratorRole && !handler.checkEndpointAccessControl(endpoint, tokenData.ID) {
		Error(w, portainer.ErrEndpointAccessDenied, http.StatusForbidden, handler.Logger)
		return
	}

	var proxy http.Handler
	proxy = handler.ProxyService.GetProxy(string(endpointID))
	if proxy == nil {
		proxy, err = handler.ProxyService.CreateAndRegisterProxy(endpoint)
		if err != nil {
			Error(w, err, http.StatusBadRequest, handler.Logger)
			return
		}
	}

	http.StripPrefix("/"+id, proxy).ServeHTTP(w, r)
}
