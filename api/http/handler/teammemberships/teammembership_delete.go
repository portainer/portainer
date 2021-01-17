package teammemberships

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

// @summary Remove user from team
// @description
// @tags team_memberships
// @security ApiKeyAuth
// @accept json
// @produce json
// @param id path string true "membership id"
// @success 204
// @failure 500,404,400,403
// @router /team_memberships/{id} [delete]
func (handler *Handler) teamMembershipDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	membershipID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid membership identifier route variable", err}
	}

	membership, err := handler.DataStore.TeamMembership().TeamMembership(portainer.TeamMembershipID(membershipID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a team membership with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a team membership with the specified identifier inside the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if !security.AuthorizedTeamManagement(membership.TeamID, securityContext) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to delete the membership", errors.ErrResourceAccessDenied}
	}

	err = handler.DataStore.TeamMembership().DeleteTeamMembership(portainer.TeamMembershipID(membershipID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the team membership from the database", err}
	}

	return response.Empty(w)
}
