package extensions

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

// StoridgeHandler represents an HTTP API handler for proxying requests to the Docker API.
type StoridgeHandler struct {
	*mux.Router
	Logger                *log.Logger
	EndpointService       portainer.EndpointService
	TeamMembershipService portainer.TeamMembershipService
	ProxyManager          *proxy.Manager
}

// NewStoridgeHandler returns a new instance of StoridgeHandler.
func NewStoridgeHandler(bouncer *security.RequestBouncer) *StoridgeHandler {
	h := &StoridgeHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.PathPrefix("/{id}/extensions/storidge").Handler(
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.proxyRequestsToStoridgeAPI)))
	return h
}

func (handler *StoridgeHandler) proxyRequestsToStoridgeAPI(w http.ResponseWriter, r *http.Request) {
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

	memberships, err := handler.TeamMembershipService.TeamMembershipsByUserID(tokenData.ID)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if tokenData.Role != portainer.AdministratorRole && !security.AuthorizedEndpointAccess(endpoint, tokenData.ID, memberships) {
		httperror.WriteErrorResponse(w, portainer.ErrEndpointAccessDenied, http.StatusForbidden, handler.Logger)
		return
	}

	var storidgeExtension *portainer.EndpointExtension
	for _, extension := range endpoint.Extensions {
		if extension.Type == portainer.StoridgeEndpointExtension {
			storidgeExtension = &extension
		}
	}

	if storidgeExtension == nil {
		httperror.WriteErrorResponse(w, portainer.ErrEndpointExtensionNotSupported, http.StatusInternalServerError, handler.Logger)
		return
	}

	proxyExtensionKey := string(endpoint.ID) + "_" + string(portainer.StoridgeEndpointExtension)

	var proxy http.Handler
	proxy = handler.ProxyManager.GetExtensionProxy(proxyExtensionKey)
	if proxy == nil {
		proxy, err = handler.ProxyManager.CreateAndRegisterExtensionProxy(proxyExtensionKey, storidgeExtension.URL)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
	}

	http.StripPrefix("/"+id+"/extensions/storidge", proxy).ServeHTTP(w, r)
}
