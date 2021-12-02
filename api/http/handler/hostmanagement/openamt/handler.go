package openamt

import (
	"net/http"

	"github.com/gorilla/mux"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle OpenAMT operations.
type Handler struct {
	*mux.Router
	OpenAMTService      portainer.OpenAMTService
	DataStore           portainer.DataStore
	DockerClientFactory *docker.ClientFactory
}

// NewHandler returns a new Handler
func NewHandler(bouncer *security.RequestBouncer, dataStore portainer.DataStore) (*Handler, error) {
	if !dataStore.Settings().IsFeatureFlagEnabled(portainer.FeatOpenAMT) {
		return nil, nil
	}

	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/open_amt", bouncer.AdminAccess(httperror.LoggerHandler(h.openAMTConfigureDefault))).Methods(http.MethodPost)
	h.Handle("/open_amt/{id}/info", bouncer.AdminAccess(httperror.LoggerHandler(h.openAMTHostInfo))).Methods(http.MethodGet)
	h.Handle("/open_amt/{id}/authorization", bouncer.AdminAccess(httperror.LoggerHandler(h.openAMTHostAuthorization))).Methods(http.MethodGet)
	h.Handle("/open_amt/{id}/associate/{deviceId}", bouncer.AdminAccess(httperror.LoggerHandler(h.openAMTAssociate))).Methods(http.MethodPost)
	h.Handle("/open_amt/{id}/devices", bouncer.AdminAccess(httperror.LoggerHandler(h.openAMTDevices))).Methods(http.MethodGet)
	h.Handle("/open_amt/{id}/devices/{deviceId}/{deviceAction}", bouncer.AdminAccess(httperror.LoggerHandler(h.deviceAction))).Methods(http.MethodPost)

	return h, nil
}
