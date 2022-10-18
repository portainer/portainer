package customtemplates

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle environment(endpoint) group operations.
type Handler struct {
	*mux.Router
	DataStore   dataservices.DataStore
	FileService portainer.FileService
	GitService  portainer.GitService
}

// NewHandler creates a handler to manage environment(endpoint) group operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/custom_templates",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.customTemplateCreate))).Methods(http.MethodPost)
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
	return h
}

func userCanEditTemplate(customTemplate *portainer.CustomTemplate, securityContext *security.RestrictedRequestContext) bool {
	return securityContext.IsAdmin || customTemplate.CreatedByUserID == securityContext.UserID
}
