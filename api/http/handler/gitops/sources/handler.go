package sources

import (
	"net/http"
	"time"

	gocache "github.com/patrickmn/go-cache"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/kubernetes/cli"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

const (
	cacheTTL             = 30 * time.Second
	cacheCleanupInterval = 10 * time.Minute
)

// Handler is the HTTP handler for the GitOps sources API.
type Handler struct {
	*mux.Router
	dataStore  dataservices.DataStore
	gitService portainer.GitService
	cache      *gocache.Cache
	k8sFactory *cli.ClientFactory
}

func NewHandler(dataStore dataservices.DataStore, gitService portainer.GitService, k8sFactory *cli.ClientFactory) *Handler {
	h := &Handler{
		Router:     mux.NewRouter(),
		dataStore:  dataStore,
		gitService: gitService,
		cache:      gocache.New(cacheTTL, cacheCleanupInterval),
		k8sFactory: k8sFactory,
	}

	router := h.PathPrefix("/gitops/sources").Subrouter()
	router.Handle("", httperror.LoggerHandler(h.list)).Methods(http.MethodGet)
	router.Handle("/summary", httperror.LoggerHandler(h.summary)).Methods(http.MethodGet)
	return h
}
