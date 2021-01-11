package teammemberships

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

// @summary List team memberships
// @description
// @tags TeamMembership
// @security ApiKeyAuth
// @accept json
// @produce json
// @success 200 {array} portainer.TeamMembership
// @failure 500
// @router /team_memberships [get]
func (handler *Handler) teamMembershipList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if !securityContext.IsAdmin && !securityContext.IsTeamLeader {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to list team memberships", errors.ErrResourceAccessDenied}
	}

	memberships, err := handler.DataStore.TeamMembership().TeamMemberships()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve team memberships from the database", err}
	}

	return response.JSON(w, memberships)
}
