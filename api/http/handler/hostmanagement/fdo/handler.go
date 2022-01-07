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
	DataStore dataservices.DataStore
}

func NewHandler(bouncer *security.RequestBouncer, dataStore dataservices.DataStore) *Handler {
	if !dataStore.Settings().IsFeatureFlagEnabled(portainer.FeatFDO) {
		return nil
	}

	h := &Handler{
		Router:    mux.NewRouter(),
		DataStore: dataStore,
	}

	h.Handle("/fdo/configure", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoConfigure))).Methods(http.MethodPost)
	h.Handle("/fdo/list", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoListAll))).Methods(http.MethodGet)
	h.Handle("/fdo/register", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoRegisterDevice))).Methods(http.MethodPost)
	h.Handle("/fdo/configure/{guid}", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoConfigureDevice))).Methods(http.MethodPost)
	h.Handle("/fdo/profiles", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoProfiles))).Methods(http.MethodGet)

	return h
}
