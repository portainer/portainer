package teammemberships

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/security"
	portainererrors "github.com/portainer/portainer/api/internal/errors"
)

// GET request on /api/team_memberships
func (handler *Handler) teamMembershipList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if !securityContext.IsAdmin && !securityContext.IsTeamLeader {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to list team memberships", errors.New(portainererrors.ErrResourceAccessDenied)}
	}

	memberships, err := handler.DataStore.TeamMembership().TeamMemberships()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve team memberships from the database", err}
	}

	return response.JSON(w, memberships)
}
