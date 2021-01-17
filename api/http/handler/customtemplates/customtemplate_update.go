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
	Logo        string
	Title       string
	Description string
	Note        string
	Platform    portainer.CustomTemplatePlatform
	Type        portainer.StackType
	FileContent string
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

// Updates a custom template
// @summary Updates a custom template
// @description
// @tags custom_templates
// @security jwt
// @accept json
// @produce json
// @param id path string true "template id"
// @param body body customTemplateUpdatePayload true "Update data"
// @success 200 {object} portainer.CustomTemplate
// @failure 400,404,500
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
