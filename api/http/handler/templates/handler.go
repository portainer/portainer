package templates

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

const (
	errTemplateManagementDisabled = portainer.Error("Template management is disabled")
)

// Handler represents an HTTP API handler for managing templates.
type Handler struct {
	*mux.Router
	TemplateService portainer.TemplateService
	SettingsService portainer.SettingsService
}

// NewHandler returns a new instance of Handler.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/templates",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.templateList))).Methods(http.MethodGet)
	h.Handle("/templates",
		bouncer.AdminAccess(h.templateManagementCheck(httperror.LoggerHandler(h.templateCreate)))).Methods(http.MethodPost)
	h.Handle("/templates/{id}",
		bouncer.RestrictedAccess(h.templateManagementCheck(httperror.LoggerHandler(h.templateInspect)))).Methods(http.MethodGet)
	h.Handle("/templates/{id}",
		bouncer.AdminAccess(h.templateManagementCheck(httperror.LoggerHandler(h.templateUpdate)))).Methods(http.MethodPut)
	h.Handle("/templates/{id}",
		bouncer.AdminAccess(h.templateManagementCheck(httperror.LoggerHandler(h.templateDelete)))).Methods(http.MethodDelete)
	return h
}

func (handler *Handler) templateManagementCheck(next http.Handler) http.Handler {
	return httperror.LoggerHandler(func(rw http.ResponseWriter, r *http.Request) *httperror.HandlerError {
		settings, err := handler.SettingsService.Settings()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
		}

		if settings.TemplatesURL != "" {
			return &httperror.HandlerError{http.StatusServiceUnavailable, "Portainer is configured to use external templates, template management is disabled", errTemplateManagementDisabled}
		}

		next.ServeHTTP(rw, r)
		return nil
	})
}
