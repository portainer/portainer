package fdo

import (
	"net/http"
	"time"

	"github.com/gorilla/mux"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/fdo/ownerclient"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle OpenAMT operations.
type Handler struct {
	*mux.Router
	DataStore portainer.DataStore
	//	DockerClientFactory *docker.ClientFactory
	fdoClient ownerclient.FDOOwnerClient
}

// NewHandler returns a new Handler
func NewHandler(bouncer *security.RequestBouncer, dataStore portainer.DataStore) (*Handler, error) {
	if !dataStore.Settings().IsFeatureFlagEnabled(portainer.FeatFDO) {
		return nil, nil
	}

	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.fdoClient = ownerclient.FDOOwnerClient{
		//OwnerURL: "http://0.0.0.0:8042",
		OwnerURL: "http://0.0.0.0:8042",
		Username: "apiUser",
		Password: "05EV9CbHbAQANc1t",
		Timeout:  5 * time.Second,
	}

	h.Handle("/hosts/fdo/list", bouncer.AdminAccess(httperror.LoggerHandler(h.fdoListAll))).Methods(http.MethodGet)
	h.Handle("/hosts/fdo/register", httperror.LoggerHandler(h.fdoRegisterDevice)).Methods(http.MethodPost)
	// h.Handle("//hosts/fdo/{id}/info", bouncer.AdminAccess(httperror.LoggerHandler(h.openAMTHostInfo))).Methods(http.MethodGet)
	// h.Handle("//hosts/fdo/{id}/authorization", bouncer.AdminAccess(httperror.LoggerHandler(h.openAMTHostAuthorization))).Methods(http.MethodGet)
	// h.Handle("//hosts/fdo/{id}/activate", bouncer.AdminAccess(httperror.LoggerHandler(h.openAMTActivate))).Methods(http.MethodPost)
	// h.Handle("//hosts/fdo/{id}/devices", bouncer.AdminAccess(httperror.LoggerHandler(h.openAMTDevices))).Methods(http.MethodGet)
	// h.Handle("//hosts/fdo/{id}/devices/{deviceId}/{deviceAction}", bouncer.AdminAccess(httperror.LoggerHandler(h.deviceAction))).Methods(http.MethodPost)

	return h, nil
}
