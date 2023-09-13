package customtemplates

import (
	"net/http"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/rs/zerolog/log"
)

// @id CustomTemplateDelete
// @summary Remove a template
// @description Remove a template.
// @description **Access policy**: authenticated
// @tags custom_templates
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Template identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Access denied to resource"
// @failure 404 "Template not found"
// @failure 500 "Server error"
// @router /custom_templates/{id} [delete]
func (handler *Handler) customTemplateDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	customTemplateID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid Custom template identifier route variable", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	customTemplate, err := handler.DataStore.CustomTemplate().Read(portainer.CustomTemplateID(customTemplateID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a custom template with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a custom template with the specified identifier inside the database", err)
	}

	resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(strconv.Itoa(customTemplateID), portainer.CustomTemplateResourceControl)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve a resource control associated to the custom template", err)
	}

	access := userCanEditTemplate(customTemplate, securityContext)
	if !access {
		return httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied)
	}

	err = handler.DataStore.CustomTemplate().Delete(portainer.CustomTemplateID(customTemplateID))
	if err != nil {
		return httperror.InternalServerError("Unable to remove the custom template from the database", err)
	}

	err = handler.FileService.RemoveDirectory(customTemplate.ProjectPath)
	if err != nil {
		log.Warn().Err(err).Msg("Unable to remove custom template files from disk")
	}

	if resourceControl != nil {
		err = handler.DataStore.ResourceControl().Delete(resourceControl.ID)
		if err != nil {
			return httperror.InternalServerError("Unable to remove the associated resource control from the database", err)
		}
	}

	return response.Empty(w)

}
