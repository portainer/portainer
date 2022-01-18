package fdo

import (
	"net/http"

	"github.com/gorilla/mux"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
)

type Handler struct {
	*mux.Router
	DataStore   dataservices.DataStore
	FileService portainer.FileService
}

func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/fdo/configure", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoConfigure))).Methods(http.MethodPost)
	h.Handle("/fdo/list", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoListAll))).Methods(http.MethodGet)
	h.Handle("/fdo/register", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoRegisterDevice))).Methods(http.MethodPost)
	h.Handle("/fdo/configure/{guid}", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoConfigureDevice))).Methods(http.MethodPost)

	h.Handle("/fdo/profiles", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoProfilesList))).Methods(http.MethodGet)
	h.Handle("/fdo/profiles", bouncer.AdminAccess(httperror.LoggerHandler(h.createProfile))).Methods(http.MethodPost)
	h.Handle("/fdo/profiles/{id}", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoProfile))).Methods(http.MethodGet)
	h.Handle("/fdo/profiles/{id}", bouncer.AdminAccess(httperror.LoggerHandler(h.updateProfile))).Methods(http.MethodPut)
	h.Handle("/fdo/profiles/{id}", bouncer.AdminAccess(httperror.LoggerHandler(h.deleteProfile))).Methods(http.MethodDelete)
	// TODO mrydel duplicate profile

	return h
}
