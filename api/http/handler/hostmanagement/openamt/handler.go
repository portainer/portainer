package openamt

import (
	"net/http"

	"github.com/gorilla/mux"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle OpenAMT operations.
type Handler struct {
	*mux.Router
	OpenAMTService portainer.OpenAMTService
	DataStore      portainer.DataStore
}

// NewHandler returns a new Handler
func NewHandler(bouncer *security.RequestBouncer, dataStore portainer.DataStore) (*Handler, error) {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	settings, err := dataStore.Settings().Settings()
	if err != nil {
		return nil, err
	}

	featureEnabled, _ := settings.FeatureFlagSettings[portainer.FeatOpenAMT]
	if featureEnabled {
		h.Handle("/open_amt", bouncer.AdminAccess(httperror.LoggerHandler(h.openAMTConfigureDefault))).Methods(http.MethodPost)
		h.Handle("/open_amt/{id}/devices", bouncer.AdminAccess(httperror.LoggerHandler(h.OpenAMTDevices))).Methods(http.MethodGet)
	}

	return h, nil
}
