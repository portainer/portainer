package namespaces

import (
	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"net/http"

	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	//"net/http"
)

type Handler struct {
	*mux.Router
	AuthorizationService *authorization.Service
	DataStore            dataservices.DataStore
}

func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/namespaces",
		bouncer.AdminAccess(httperror.LoggerHandler(h.namespaceCreate))).Methods(http.MethodPost)
	h.Handle("/namespaces",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.namespacesList))).Methods(http.MethodGet)
	h.Handle("/namespaces/createOrUpdate",
		bouncer.AdminAccess(httperror.LoggerHandler(h.namespaceCreateOrUpdate))).Methods(http.MethodPost)
	h.Handle("/namespaces/{name}/containers",
		bouncer.AdminAccess(httperror.LoggerHandler(h.namespacesContainerList))).Methods(http.MethodGet)
	h.Handle("/namespaces/{containerId}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.namespaceInspect))).Methods(http.MethodGet)
	h.Handle("/namespaces/{name}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.namespaceDelete))).Methods(http.MethodDelete)
	return h
}
