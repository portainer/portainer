package customtemplates

import (
	"net/http"
	"strconv"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
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
		return portainer.Error("Invalid custom template title")
	}
	if govalidator.IsNull(payload.FileContent) {
		return portainer.Error("Invalid file content")
	}
	if payload.Platform != portainer.CustomTemplatePlatformLinux && payload.Platform != portainer.CustomTemplatePlatformWindows {
		return portainer.Error("Invalid custom template platform")
	}
	if payload.Type != portainer.DockerComposeStack && payload.Type != portainer.DockerSwarmStack {
		return portainer.Error("Invalid custom template type")
	}
	if govalidator.IsNull(payload.Description) {
		return portainer.Error("Invalid custom template description")
	}
	return nil
}

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

	customTemplate, err := handler.DataStore.CustomTemplate().CustomTemplate(portainer.CustomTemplateID(customTemplateID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a custom template with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a custom template with the specified identifier inside the database", err}
	}

	resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(strconv.Itoa(customTemplateID), portainer.CustomTemplateResourceControl)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve a resource control associated to the custom template", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	access, err := handler.userCanAccessTemplate(securityContext, resourceControl)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to verify user authorizations to validate custom template access", err}
	}
	if !access {
		return &httperror.HandlerError{http.StatusForbidden, "Access denied to resource", portainer.ErrResourceAccessDenied}
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
