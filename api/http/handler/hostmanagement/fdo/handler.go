package fdo

import (
	portainer "github.com/portainer/portainer/api"
	"net/http"

	"github.com/gorilla/mux"

	httperror "github.com/portainer/libhttp/error"
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

	h.Handle("/fdo/profiles", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoProfiles))).Methods(http.MethodGet)
	h.Handle("/fdo/profiles", bouncer.AdminAccess(httperror.LoggerHandler(h.createProfile))).Methods(http.MethodPost)
	// TODO mrydel update/delete profile

	return h
}
