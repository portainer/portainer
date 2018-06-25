package templates

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type templateUpdatePayload struct {
	Title string
}

func (payload *templateUpdatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Title) {
		return portainer.Error("Invalid template title")
	}
	return nil
}

// PUT request on /api/templates/:id
func (handler *Handler) templateUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	templateID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid template identifier route variable", err}
	}

	template, err := handler.TemplateService.Template(portainer.TemplateID(templateID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a template with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a template with the specified identifier inside the database", err}
	}

	var payload templateUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	template.Title = payload.Title
	// TODO: fields set

	err = handler.TemplateService.UpdateTemplate(template.ID, template)
	if err != nil {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to persist template changes inside the database", err}
	}

	return response.JSON(w, template)
}
