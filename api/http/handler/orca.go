package handler

import (
	//"strconv"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/security"

	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// OrcaHandler represents an HTTP API handler for proxying requests to the Orca API.
type OrcaHandler struct {
	*mux.Router
	Logger                *log.Logger
	EndpointService       portainer.EndpointService
	TeamMembershipService portainer.TeamMembershipService
	ProxyManager          *proxy.OrcaManager
}

// NewOrcaHandler returns a new instance of OrcaHandler.
func NewOrcaHandler(bouncer *security.RequestBouncer) *OrcaHandler {
	h := &OrcaHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.PathPrefix("/{id}/orca").Handler(
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.proxyRequestsToOrcaAPI)))
	return h
}

func (handler *OrcaHandler) checkEndpointAccessControl(endpoint *portainer.Endpoint, userID portainer.UserID) bool {
	for _, authorizedUserID := range endpoint.AuthorizedUsers {
		if authorizedUserID == userID {
			return true
		}
	}

	memberships, _ := handler.TeamMembershipService.TeamMembershipsByUserID(userID)
	for _, authorizedTeamID := range endpoint.AuthorizedTeams {
		for _, membership := range memberships {
			if membership.TeamID == authorizedTeamID {
				return true
			}
		}
	}
	return false
}

func (handler *OrcaHandler) proxyRequestsToOrcaAPI(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

    /*
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
	*/

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	//&& !handler.checkEndpointAccessControl(endpoint, tokenData.ID)
	if tokenData.Role != portainer.AdministratorRole {
		httperror.WriteErrorResponse(w, portainer.ErrEndpointAccessDenied, http.StatusForbidden, handler.Logger)
		return
	}

	var proxy http.Handler
	proxy = handler.ProxyManager.GetOrcaProxy(id)

	if proxy == nil {
	    log.Println("Registering new Orca proxy manager...")

	    // TODO: define external gateway

		proxy, err = handler.ProxyManager.CreateAndRegisterOrcaProxy(id, "http://172.17.0.1:20002", false)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
			return
		}
	}

	http.StripPrefix("/"+id+"/orca", proxy).ServeHTTP(w, r)
}
