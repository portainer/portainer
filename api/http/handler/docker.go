package handler

import (
	"strconv"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/context"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/middleware"
	"github.com/portainer/portainer/http/proxy"

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
	ProxyService    *proxy.Service
}

// NewDockerHandler returns a new instance of DockerHandler.
func NewDockerHandler(mw *middleware.Service) *DockerHandler {
	h := &DockerHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.PathPrefix("/{id}/").Handler(
		mw.Authenticated(http.HandlerFunc(h.proxyRequestsToDockerAPI)))
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
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpointID := portainer.EndpointID(parsedID)
	endpoint, err := handler.EndpointService.Endpoint(endpointID)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	tokenData, err := context.GetTokenData(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
	}
	if tokenData.Role != portainer.AdministratorRole && !handler.checkEndpointAccessControl(endpoint, tokenData.ID) {
		httperror.WriteErrorResponse(w, portainer.ErrEndpointAccessDenied, http.StatusForbidden, handler.Logger)
		return
	}

	var proxy http.Handler
	proxy = handler.ProxyService.GetProxy(string(endpointID))
	if proxy == nil {
		proxy, err = handler.ProxyService.CreateAndRegisterProxy(endpoint)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
			return
		}
	}

	http.StripPrefix("/"+id, proxy).ServeHTTP(w, r)
}
