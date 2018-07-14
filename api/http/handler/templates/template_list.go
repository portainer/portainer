package templates

import (
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/response"
	"github.com/portainer/portainer/http/security"
)

// GET request on /api/templates
func (handler *Handler) templateList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	templates, err := handler.TemplateService.Templates()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve templates from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	filteredTemplates := security.FilterTemplates(templates, securityContext)

	return response.JSON(w, filteredTemplates)
}
