package scenes

import (
	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"net/http"
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
	h.Handle("/scenes", bouncer.AdminAccess(httperror.LoggerHandler(h.sceneCreate))).Methods(http.MethodPost)
	h.Handle("/scenes", bouncer.RestrictedAccess(httperror.LoggerHandler(h.sceneList))).Methods(http.MethodGet)
	h.Handle("/scenes/{id}", bouncer.AdminAccess(httperror.LoggerHandler(h.sceneInspect))).Methods(http.MethodGet)
	h.Handle("/scenes/{id}", bouncer.AdminAccess(httperror.LoggerHandler(h.sceneUpdate))).Methods(http.MethodPut)
	h.Handle("/scenes/{id}", bouncer.AdminAccess(httperror.LoggerHandler(h.sceneDelete))).Methods(http.MethodDelete)
	return h
}
