package customtemplates

import (
	"errors"
	"net/http"
	"strconv"

	bolterrors "github.com/portainer/portainer/api/bolt/errors"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

type customTemplateUpdatePayload struct {
	// URL of the template's logo
	Logo string `example:"https://cloudinovasi.id/assets/img/logos/nginx.png"`
	// Title of the template
	Title string `example:"Nginx" validate:"required"`
	// Description of the template
	Description string `example:"High performance web server" validate:"required"`
	// A note that will be displayed in the UI. Supports HTML content
	Note string `example:"This is my <b>custom</b> template"`
	// Platform associated to the template.
	// Valid values are: 1 - 'linux', 2 - 'windows'
	Platform portainer.CustomTemplatePlatform `example:"1" enums:"1,2" validate:"required"`
	// Type of created stack (1 - swarm, 2 - compose)
	Type portainer.StackType `example:"1" enums:"1,2" validate:"required"`
	// Content of stack file
	FileContent string `validate:"required"`
}

func (payload *customTemplateUpdatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Title) {
		return errors.New("Invalid custom template title")
	}
	if govalidator.IsNull(payload.FileContent) {
		return errors.New("Invalid file content")
	}
	if payload.Platform != portainer.CustomTemplatePlatformLinux && payload.Platform != portainer.CustomTemplatePlatformWindows {
		return errors.New("Invalid custom template platform")
	}
	if payload.Type != portainer.DockerComposeStack && payload.Type != portainer.DockerSwarmStack {
		return errors.New("Invalid custom template type")
	}
	if govalidator.IsNull(payload.Description) {
		return errors.New("Invalid custom template description")
	}
	return nil
}

// @id CustomTemplateUpdate
// @summary Update a template
// @description Update a template.
// @description **Access policy**: authenticated
// @tags custom_templates
// @security jwt
// @accept json
// @produce json
// @param id path int true "Template identifier"
// @param body body customTemplateUpdatePayload true "Template details"
// @success 200 {object} portainer.CustomTemplate "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access template"
// @failure 404 "Template not found"
// @failure 500 "Server error"
// @router /custom_templates/{id} [put]
func (handler *Handler) customTemplateUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	customTemplateID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid Custom template identifier route variable", err}
	}

	var payload customTemplateUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	customTemplates, err := handler.DataStore.CustomTemplate().CustomTemplates()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve custom templates from the database", err}
	}

	for _, existingTemplate := range customTemplates {
		if existingTemplate.ID != portainer.CustomTemplateID(customTemplateID) && existingTemplate.Title == payload.Title {
			return &httperror.HandlerError{http.StatusInternalServerError, "Template name must be unique", errors.New("Template name must be unique")}
		}
	}

	customTemplate, err := handler.DataStore.CustomTemplate().CustomTemplate(portainer.CustomTemplateID(customTemplateID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a custom template with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a custom template with the specified identifier inside the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	access := userCanEditTemplate(customTemplate, securityContext)
	if !access {
		return &httperror.HandlerError{http.StatusForbidden, "Access denied to resource", httperrors.ErrResourceAccessDenied}
	}

	templateFolder := strconv.Itoa(customTemplateID)
	_, err = handler.FileService.StoreCustomTemplateFileFromBytes(templateFolder, customTemplate.EntryPoint, []byte(payload.FileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist updated custom template file on disk", err}
	}

	customTemplate.Title = payload.Title
	customTemplate.Logo = payload.Logo
	customTemplate.Description = payload.Description
	customTemplate.Note = payload.Note
	customTemplate.Platform = payload.Platform
	customTemplate.Type = payload.Type

	err = handler.DataStore.CustomTemplate().UpdateCustomTemplate(customTemplate.ID, customTemplate)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist custom template changes inside the database", err}
	}

	return response.JSON(w, customTemplate)
}
