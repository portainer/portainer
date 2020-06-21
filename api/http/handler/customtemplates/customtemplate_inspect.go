package customtemplates

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
)

func (handler *Handler) customTemplateInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	customTemplateID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid Custom template identifier route variable", err}
	}

	customTemplate, err := handler.DataStore.CustomTemplate().CustomTemplate(portainer.CustomTemplateID(customTemplateID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a custom template with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a custom template with the specified identifier inside the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user info from request context", err}
	}

	resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(strconv.Itoa(customTemplateID), portainer.CustomTemplateResourceControl)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve a resource control associated to the custom template", err}
	}

	access, err := handler.userCanAccessTemplate(securityContext, resourceControl)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to verify user authorizations to validate custom template access", err}
	}
	if !access {
		return &httperror.HandlerError{http.StatusForbidden, "Access denied to resource", portainer.ErrResourceAccessDenied}
	}

	if resourceControl != nil {
		customTemplate.ResourceControl = resourceControl
	}

	return response.JSON(w, customTemplate)
}

func (handler *Handler) userCanAccessTemplate(securityContext *security.RestrictedRequestContext, resourceControl *portainer.ResourceControl) (bool, error) {
	if securityContext.IsAdmin {
		return true, nil
	}

	userTeamIDs := make([]portainer.TeamID, 0)
	for _, membership := range securityContext.UserMemberships {
		userTeamIDs = append(userTeamIDs, membership.TeamID)
	}

	if resourceControl != nil && authorization.UserCanAccessResource(securityContext.UserID, userTeamIDs, resourceControl) {
		return true, nil
	}

	return false, nil
}
