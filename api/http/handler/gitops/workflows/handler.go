package workflows

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/kubernetes/cli"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

type Handler struct {
	*mux.Router
	dataStore  dataservices.DataStore
	gitService portainer.GitService
	k8sFactory *cli.ClientFactory
}

func NewHandler(dataStore dataservices.DataStore, gitService portainer.GitService, k8sFactory *cli.ClientFactory) *Handler {
	h := &Handler{
		Router:     mux.NewRouter(),
		dataStore:  dataStore,
		gitService: gitService,
		k8sFactory: k8sFactory,
	}

	h.Handle("/gitops/workflows", httperror.LoggerHandler(h.list)).Methods(http.MethodGet)
	h.Handle("/gitops/workflows/summary", httperror.LoggerHandler(h.summary)).Methods(http.MethodGet)
	h.Handle("/gitops/workflows/{id}", httperror.LoggerHandler(h.get)).Methods(http.MethodGet)

	return h
}
