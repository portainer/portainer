package gitops

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
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

	h.Handle("/gitops/repo/file/preview",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.gitOperationRepoFilePreview))).Methods(http.MethodPost)

	return h
}
