package customtemplates

import (
	"net/http"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/slicesx"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type fileResponse struct {
	FileContent string
}

// @id CustomTemplateFile
// @summary Get Template stack file content.
// @description Retrieve the content of the Stack file for the specified custom template
// @description **Access policy**: authenticated
// @tags custom_templates
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Template identifier"
// @success 200 {object} fileResponse "Success"
// @failure 400 "Invalid request"
// @failure 404 "Custom template not found"
// @failure 500 "Server error"
// @router /custom_templates/{id}/file [get]
func (handler *Handler) customTemplateFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	customTemplateID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid custom template identifier route variable", err)
	}

	var customTemplate *portainer.CustomTemplate
	if err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		customTemplate, err = tx.CustomTemplate().Read(portainer.CustomTemplateID(customTemplateID))
		if tx.IsErrObjectNotFound(err) {
			return httperror.NotFound("Unable to find a custom template with the specified identifier inside the database", err)
		} else if err != nil {
			return httperror.InternalServerError("Unable to find a custom template with the specified identifier inside the database", err)
		}

		resourceControl, err := tx.ResourceControl().ResourceControlByResourceIDAndType(strconv.Itoa(customTemplateID), portainer.CustomTemplateResourceControl)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve a resource control associated to the custom template", err)
		}

		securityContext, err := security.RetrieveRestrictedRequestContext(r)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve user info from request context", err)
		}

		canEdit := userCanEditTemplate(customTemplate, securityContext)
		hasAccess := false

		if resourceControl != nil {
			customTemplate.ResourceControl = resourceControl

			teamIDs := slicesx.Map(securityContext.UserMemberships, func(m portainer.TeamMembership) portainer.TeamID {
				return m.TeamID
			})

			hasAccess = authorization.UserCanAccessResource(securityContext.UserID, teamIDs, resourceControl)
		}

		if canEdit || hasAccess {
			return nil
		}

		return httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied)
	}); err != nil {
		return response.TxErrorResponse(err)
	}

	entryPath := customTemplate.EntryPoint
	if customTemplate.GitConfig != nil {
		entryPath = customTemplate.GitConfig.ConfigFilePath
	}
	fileContent, err := handler.FileService.GetFileContent(customTemplate.ProjectPath, entryPath)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve custom template file from disk", err)
	}

	return response.JSON(w, &fileResponse{FileContent: string(fileContent)})
}
