package customtemplates

import (
	"net/http"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/slicesx"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
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
// @param edge query boolean false "Filter by edge templates"
// @success 200 {array} portainer.CustomTemplate "Success"
// @failure 500 "Server error"
// @router /custom_templates [get]
func (handler *Handler) customTemplateList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	templateTypes, err := parseTemplateTypes(r)
	if err != nil {
		return httperror.BadRequest("Invalid Custom template type", err)
	}

	edge := retrieveEdgeParam(r)

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	var customTemplates []portainer.CustomTemplate
	err = handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		customTemplates, err = tx.CustomTemplate().ReadAll()
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve custom templates from the database", err)
		}

		resourceControls, err := tx.ResourceControl().ReadAll()
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve resource controls from the database", err)
		}

		customTemplates = authorization.DecorateCustomTemplates(customTemplates, resourceControls)

		if !securityContext.IsAdmin {
			user, err := tx.User().Read(securityContext.UserID)
			if err != nil {
				return httperror.InternalServerError("Unable to retrieve user information from the database", err)
			}

			userTeamIDs := authorization.TeamIDs(securityContext.UserMemberships)

			customTemplates = authorization.FilterAuthorizedCustomTemplates(customTemplates, user, userTeamIDs)
		}

		customTemplates = filterByType(customTemplates, templateTypes)

		if edge != nil {
			customTemplates = slicesx.FilterInPlace(customTemplates, func(customTemplate portainer.CustomTemplate) bool {
				return customTemplate.EdgeTemplate == *edge
			})
		}

		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
		for i := range customTemplates {
			populateGitConfig(tx, userContext, &customTemplates[i])
		}

		return nil
	})

	return response.TxResponse(w, customTemplates, err)
}

func retrieveEdgeParam(r *http.Request) *bool {
	var edge *bool
	edgeParam, _ := request.RetrieveQueryParameter(r, "edge", true)
	if edgeParam != "" {
		edgeVal, err := strconv.ParseBool(edgeParam)
		if err != nil {
			log.Warn().Err(err).Msg("failed parsing edge param")
			return nil
		}

		edge = &edgeVal
	}
	return edge
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
