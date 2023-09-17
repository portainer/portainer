package customtemplates

import (
	"net/http"
	"sync"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle environment(endpoint) group operations.
type Handler struct {
	*mux.Router
	DataStore      dataservices.DataStore
	FileService    portainer.FileService
	GitService     portainer.GitService
	gitFetchMutexs map[portainer.TemplateID]*sync.Mutex
}

// NewHandler creates a handler to manage environment(endpoint) group operations.
func NewHandler(bouncer security.BouncerService, dataStore dataservices.DataStore, fileService portainer.FileService, gitService portainer.GitService) *Handler {
	h := &Handler{
		Router:         mux.NewRouter(),
		DataStore:      dataStore,
		FileService:    fileService,
		GitService:     gitService,
		gitFetchMutexs: make(map[portainer.TemplateID]*sync.Mutex),
	}

	h.Handle("/custom_templates/create/{method}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.customTemplateCreate))).Methods(http.MethodPost)
	h.Handle("/custom_templates", middlewares.Deprecated(h, deprecatedCustomTemplateCreateUrlParser)).Methods(http.MethodPost) // Deprecated
	h.Handle("/custom_templates",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.customTemplateList))).Methods(http.MethodGet)
	h.Handle("/custom_templates/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.customTemplateInspect))).Methods(http.MethodGet)
	h.Handle("/custom_templates/{id}/file",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.customTemplateFile))).Methods(http.MethodGet)
	h.Handle("/custom_templates/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.customTemplateUpdate))).Methods(http.MethodPut)
	h.Handle("/custom_templates/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.customTemplateDelete))).Methods(http.MethodDelete)
	h.Handle("/custom_templates/{id}/git_fetch",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.customTemplateGitFetch))).Methods(http.MethodPut)
	return h
}

func userCanEditTemplate(customTemplate *portainer.CustomTemplate, securityContext *security.RestrictedRequestContext) bool {
	return securityContext.IsAdmin || customTemplate.CreatedByUserID == securityContext.UserID
}
