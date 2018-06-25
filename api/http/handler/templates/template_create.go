package templates

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type templateCreatePayload struct {
	Title string
}

func (payload *templateCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Title) {
		return portainer.Error("Invalid template title")
	}
	return nil
}

// POST request on /api/templates
func (handler *Handler) templateCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload templateCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	// TODO: set fields
	template := &portainer.Template{
		Title: payload.Title,
	}

	err = handler.TemplateService.CreateTemplate(template)
	if err != nil {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to persist the template inside the database", err}
	}

	return response.JSON(w, template)
}
