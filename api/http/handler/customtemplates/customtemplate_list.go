package customtemplates

import (
	"net/http"
	"strconv"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
)

// @id CustomTemplateList
// @summary List available custom templates
// @description List available custom templates.
// @description **Access policy**: authenticated
// @tags custom_templates
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param type query []int true "Template types" Enums(1,2,3)
// @success 200 {array} portainer.CustomTemplate "Success"
// @failure 500 "Server error"
// @router /custom_templates [get]
func (handler *Handler) customTemplateList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	templateTypes, err := parseTemplateTypes(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid Custom template type", err}
	}

	customTemplates, err := handler.DataStore.CustomTemplate().CustomTemplates()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve custom templates from the database", err}
	}

	resourceControls, err := handler.DataStore.ResourceControl().ResourceControls()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve resource controls from the database", err}
	}

	customTemplates = authorization.DecorateCustomTemplates(customTemplates, resourceControls)

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if !securityContext.IsAdmin {
		user, err := handler.DataStore.User().User(securityContext.UserID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user information from the database", err}
		}

		userTeamIDs := make([]portainer.TeamID, 0)
		for _, membership := range securityContext.UserMemberships {
			userTeamIDs = append(userTeamIDs, membership.TeamID)
		}

		customTemplates = authorization.FilterAuthorizedCustomTemplates(customTemplates, user, userTeamIDs)
	}

	customTemplates = filterByType(customTemplates, templateTypes)

	return response.JSON(w, customTemplates)
}

func parseTemplateTypes(r *http.Request) ([]portainer.StackType, error) {
	err := r.ParseForm()
	if err != nil {
		return nil, errors.WithMessage(err, "failed to parse request params")
	}

	types, exist := r.Form["type"]
	if !exist {
		return []portainer.StackType{}, nil
	}

	res := []portainer.StackType{}
	for _, templateTypeStr := range types {
		templateType, err := strconv.Atoi(templateTypeStr)
		if err != nil {
			return nil, errors.WithMessage(err, "failed parsing template type")
		}

		res = append(res, portainer.StackType(templateType))
	}

	return res, nil
}

func filterByType(customTemplates []portainer.CustomTemplate, templateTypes []portainer.StackType) []portainer.CustomTemplate {
	if len(templateTypes) == 0 {
		return customTemplates
	}

	typeSet := map[portainer.StackType]bool{}
	for _, templateType := range templateTypes {
		typeSet[templateType] = true
	}

	filtered := []portainer.CustomTemplate{}

	for _, template := range customTemplates {
		if typeSet[template.Type] {
			filtered = append(filtered, template)
		}
	}

	return filtered
}
