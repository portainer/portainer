package templates

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// DELETE request on /api/templates/:id
func (handler *Handler) templateDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid template identifier route variable", err}
	}

	err = handler.TemplateService.DeleteTemplate(portainer.TemplateID(id))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the template from the database", err}
	}

	return response.Empty(w)
}
