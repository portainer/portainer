package handler

import (
	"strconv"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/security"

	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// AzureHandler represents an HTTP API handler for proxying requests to the Azure API.
type AzureHandler struct {
	*mux.Router
	Logger                *log.Logger
	EndpointService       portainer.EndpointService
	EndpointGroupService  portainer.EndpointGroupService
	TeamMembershipService portainer.TeamMembershipService
	ProxyManager          *proxy.Manager
}

// NewAzureHandler returns a new instance of AzureHandler.
func NewAzureHandler(bouncer *security.RequestBouncer) *AzureHandler {
	h := &AzureHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.PathPrefix("/{id}/azure").Handler(
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.proxyRequestsToAzureAPI)))
	return h
}

func (handler *AzureHandler) checkEndpointAccess(endpoint *portainer.Endpoint, userID portainer.UserID) error {
	memberships, err := handler.TeamMembershipService.TeamMembershipsByUserID(userID)
	if err != nil {
		return err
	}

	group, err := handler.EndpointGroupService.EndpointGroup(endpoint.GroupID)
	if err != nil {
		return err
	}

	if !security.AuthorizedEndpointAccess(endpoint, group, userID, memberships) {
		return portainer.ErrEndpointAccessDenied
	}

	return nil
}

func (handler *AzureHandler) proxyRequestsToAzureAPI(w http.ResponseWriter, r *http.Request) {
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

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if tokenData.Role != portainer.AdministratorRole {
		err = handler.checkEndpointAccess(endpoint, tokenData.ID)
		if err != nil && err == portainer.ErrEndpointAccessDenied {
			httperror.WriteErrorResponse(w, err, http.StatusForbidden, handler.Logger)
			return
		} else if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
	}

	var proxy http.Handler
	proxy = handler.ProxyManager.GetProxy(string(endpointID))
	if proxy == nil {
		proxy, err = handler.ProxyManager.CreateAndRegisterProxy(endpoint)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
	}

	http.StripPrefix("/"+id+"/azure", proxy).ServeHTTP(w, r)
}
