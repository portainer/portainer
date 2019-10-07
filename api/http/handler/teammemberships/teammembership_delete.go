package teammemberships

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// DELETE request on /api/team_memberships/:id
func (handler *Handler) teamMembershipDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	membershipID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid membership identifier route variable", err}
	}

	membership, err := handler.TeamMembershipService.TeamMembership(portainer.TeamMembershipID(membershipID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a team membership with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a team membership with the specified identifier inside the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if !security.AuthorizedTeamManagement(membership.TeamID, securityContext) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to delete the membership", portainer.ErrResourceAccessDenied}
	}

	err = handler.TeamMembershipService.DeleteTeamMembership(portainer.TeamMembershipID(membershipID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the team membership from the database", err}
	}

	err = handler.AuthorizationService.UpdateUsersAuthorizations()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update user authorizations", err}
	}

	return response.Empty(w)
}
