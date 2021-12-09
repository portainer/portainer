package fdo

import (
	"net/http"

	"github.com/gorilla/mux"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

type Handler struct {
	*mux.Router
	DataStore portainer.DataStore
}

func NewHandler(bouncer *security.RequestBouncer, dataStore portainer.DataStore) *Handler {
	if !dataStore.Settings().IsFeatureFlagEnabled(portainer.FeatFDO) {
		return nil
	}

	h := &Handler{
		Router:    mux.NewRouter(),
		DataStore: dataStore,
	}

	h.Handle("/fdo", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoConfigure))).Methods(http.MethodPost)
	h.Handle("/fdo/list", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoListAll))).Methods(http.MethodGet)
	h.Handle("/fdo/register", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoRegisterDevice))).Methods(http.MethodPost)
	h.Handle("/fdo/configure/{guid}", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoConfigureDevice))).Methods(http.MethodPost)

	return h
}
