package openamt

import (
	"net/http"

	"github.com/gorilla/mux"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle OpenAMT operations.
type Handler struct {
	*mux.Router
	OpenAMTService portainer.OpenAMTService
	DataStore      datastore.DataStore
}

// NewHandler returns a new Handler
func NewHandler(bouncer *security.RequestBouncer, dataStore datastore.DataStore) (*Handler, error) {
	if !dataStore.Settings().IsFeatureFlagEnabled(portainer.FeatOpenAMT) {
		return nil, nil
	}

	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/open_amt", bouncer.AdminAccess(httperror.LoggerHandler(h.openAMTConfigureDefault))).Methods(http.MethodPost)

	return h, nil
}
