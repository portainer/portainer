package edgeupdateschedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"

	"github.com/gorilla/mux"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/edgetypes"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
)

const contextKey = "edgeUpdateSchedule_item"

// Handler is the HTTP handler used to handle edge environment(endpoint) operations.
type Handler struct {
	*mux.Router
	requestBouncer *security.RequestBouncer
	dataStore      dataservices.DataStore
}

// NewHandler creates a handler to manage environment(endpoint) operations.
func NewHandler(bouncer *security.RequestBouncer, dataStore dataservices.DataStore) *Handler {
	h := &Handler{
		Router:         mux.NewRouter(),
		requestBouncer: bouncer,
		dataStore:      dataStore,
	}

	router := h.PathPrefix("/edge_update_schedules").Subrouter()
	router.Use(bouncer.AdminAccess)
	router.Use(middlewares.FeatureFlag(dataStore.Settings(), portainer.FeatureFlagEdgeRemoteUpdate))

	router.Handle("",
		httperror.LoggerHandler(h.list)).Methods(http.MethodGet)

	router.Handle("",
		httperror.LoggerHandler(h.create)).Methods(http.MethodPost)

	itemRouter := router.PathPrefix("/{id}").Subrouter()
	itemRouter.Use(middlewares.WithItem(func(id edgetypes.UpdateScheduleID) (*edgetypes.UpdateSchedule, error) {
		return dataStore.EdgeUpdateSchedule().Item(id)
	}, "id", contextKey))

	itemRouter.Handle("",
		httperror.LoggerHandler(h.inspect)).Methods(http.MethodGet)

	itemRouter.Handle("",
		httperror.LoggerHandler(h.update)).Methods(http.MethodPut)

	itemRouter.Handle("",
		httperror.LoggerHandler(h.delete)).Methods(http.MethodDelete)

	return h
}
