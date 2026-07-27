package sources

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/gitops/scheduling"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes/cli"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler for the GitOps sources API.
type Handler struct {
	*mux.Router
	dataStore       dataservices.DataStore
	gitService      portainer.GitService
	k8sFactory      *cli.ClientFactory
	sourceScheduler *scheduling.SourceScheduler
}

func NewHandler(bouncer security.BouncerService, dataStore dataservices.DataStore, gitService portainer.GitService, k8sFactory *cli.ClientFactory, sourceScheduler *scheduling.SourceScheduler) *Handler {
	h := &Handler{
		Router:          mux.NewRouter(),
		dataStore:       dataStore,
		gitService:      gitService,
		k8sFactory:      k8sFactory,
		sourceScheduler: sourceScheduler,
	}

	authenticatedRouter := h.PathPrefix("/gitops/sources").Subrouter()
	authenticatedRouter.Use(bouncer.AuthenticatedAccess)
	authenticatedRouter.Handle("", httperror.LoggerHandler(h.list)).Methods(http.MethodGet)
	authenticatedRouter.Handle("/summary", httperror.LoggerHandler(h.summary)).Methods(http.MethodGet)
	authenticatedRouter.Handle("/{id}", httperror.LoggerHandler(h.getSource)).Methods(http.MethodGet)
	authenticatedRouter.Handle("/{id}/workflows", httperror.LoggerHandler(h.listSourceWorkflows)).Methods(http.MethodGet)
	authenticatedRouter.Handle("/git", httperror.LoggerHandler(h.gitSourceCreate)).Methods(http.MethodPost)
	authenticatedRouter.Handle("/test", httperror.LoggerHandler(h.gitSourceTest)).Methods(http.MethodPost)
	authenticatedRouter.Handle("/{id}", httperror.LoggerHandler(h.gitSourceUpdate)).Methods(http.MethodPut)
	authenticatedRouter.Handle("/{id}", httperror.LoggerHandler(h.sourceDelete)).Methods(http.MethodDelete)
	authenticatedRouter.Handle("/{id}/test", httperror.LoggerHandler(h.sourceTestConnection)).Methods(http.MethodPost)

	adminRouter := h.PathPrefix("/gitops/sources").Subrouter()
	adminRouter.Use(bouncer.AdminAccess)
	adminRouter.Handle("/{id}/access", httperror.LoggerHandler(h.gitSourceUpdateAccess)).Methods(http.MethodPut)

	return h
}
