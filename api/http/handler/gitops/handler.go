package gitops

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"

	"github.com/portainer/portainer/api/http/handler/gitops/workflows"
)

// Handler is the HTTP handler used to handle git repo operation
type Handler struct {
	*mux.Router
	dataStore   dataservices.DataStore
	gitService  portainer.GitService
	fileService portainer.FileService
}

func NewHandler(bouncer security.BouncerService, dataStore dataservices.DataStore, gitService portainer.GitService, fileService portainer.FileService) *Handler {
	h := &Handler{
		Router:      mux.NewRouter(),
		dataStore:   dataStore,
		gitService:  gitService,
		fileService: fileService,
	}

	authenticatedRouter := h.NewRoute().Subrouter()
	authenticatedRouter.Use(bouncer.AuthenticatedAccess)

	authenticatedRouter.Handle("/gitops/repo/file/preview", httperror.LoggerHandler(h.gitOperationRepoFilePreview)).Methods(http.MethodPost)

	workflowsHandler := workflows.NewHandler(dataStore, gitService)
	authenticatedRouter.PathPrefix("/gitops/workflows").Handler(workflowsHandler)

	return h
}
