package teammemberships

import (
	"github.com/portainer/portainer/api/bolt/errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

type teamMembershipUpdatePayload struct {
	UserID int
	TeamID int
	Role   int
}

func (payload *teamMembershipUpdatePayload) Validate(r *http.Request) error {
	if payload.UserID == 0 {
		return portainer.Error("Invalid UserID")
	}
	if payload.TeamID == 0 {
		return portainer.Error("Invalid TeamID")
	}
	if payload.Role != 1 && payload.Role != 2 {
		return portainer.Error("Invalid role value. Value must be one of: 1 (leader) or 2 (member)")
	}
	return nil
}

// PUT request on /api/team_memberships/:id
func (handler *Handler) teamMembershipUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	membershipID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid membership identifier route variable", err}
	}

	var payload teamMembershipUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if !security.AuthorizedTeamManagement(portainer.TeamID(payload.TeamID), securityContext) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to update the membership", portainer.ErrResourceAccessDenied}
	}

	membership, err := handler.DataStore.TeamMembership().TeamMembership(portainer.TeamMembershipID(membershipID))
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a team membership with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a team membership with the specified identifier inside the database", err}
	}

	if securityContext.IsTeamLeader && membership.Role != portainer.MembershipRole(payload.Role) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to update the role of membership", portainer.ErrResourceAccessDenied}
	}

	membership.UserID = portainer.UserID(payload.UserID)
	membership.TeamID = portainer.TeamID(payload.TeamID)
	membership.Role = portainer.MembershipRole(payload.Role)

	err = handler.DataStore.TeamMembership().UpdateTeamMembership(membership.ID, membership)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist membership changes inside the database", err}
	}

	return response.JSON(w, membership)
}
