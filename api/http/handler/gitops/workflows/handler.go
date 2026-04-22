package workflows

import (
	"net/http"
	"time"

	gocache "github.com/patrickmn/go-cache"
	"github.com/portainer/portainer/api/dataservices"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

const (
	cacheTTL             = 30 * time.Second
	cacheCleanupInterval = 10 * time.Minute
)

type Handler struct {
	*mux.Router
	dataStore dataservices.DataStore
	cache     *gocache.Cache
}

func NewHandler(dataStore dataservices.DataStore) *Handler {
	h := &Handler{
		Router:    mux.NewRouter(),
		dataStore: dataStore,
		cache:     gocache.New(cacheTTL, cacheCleanupInterval),
	}

	h.Handle("/gitops/workflows", httperror.LoggerHandler(h.list)).Methods(http.MethodGet)
	h.Handle("/gitops/workflows/summary", httperror.LoggerHandler(h.summary)).Methods(http.MethodGet)

	return h
}
