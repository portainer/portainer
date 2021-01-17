package teammemberships

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

type teamMembershipCreatePayload struct {
	UserID int
	TeamID int
	Role   int
}

func (payload *teamMembershipCreatePayload) Validate(r *http.Request) error {
	if payload.UserID == 0 {
		return errors.New("Invalid UserID")
	}
	if payload.TeamID == 0 {
		return errors.New("Invalid TeamID")
	}
	if payload.Role != 1 && payload.Role != 2 {
		return errors.New("Invalid role value. Value must be one of: 1 (leader) or 2 (member)")
	}
	return nil
}

// @summary Add user to team
// @description
// @tags team_memberships
// @security jwt
// @accept json
// @produce json
// @param body body teamMembershipCreatePayload true "membership data"
// @success 200 {object} portainer.TeamMembership "TeamMembership"
// @failure 500
// @router /team_memberships [post]
func (handler *Handler) teamMembershipCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload teamMembershipCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if !security.AuthorizedTeamManagement(portainer.TeamID(payload.TeamID), securityContext) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to manage team memberships", httperrors.ErrResourceAccessDenied}
	}

	memberships, err := handler.DataStore.TeamMembership().TeamMembershipsByUserID(portainer.UserID(payload.UserID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve team memberships from the database", err}
	}

	if len(memberships) > 0 {
		for _, membership := range memberships {
			if membership.UserID == portainer.UserID(payload.UserID) && membership.TeamID == portainer.TeamID(payload.TeamID) {
				return &httperror.HandlerError{http.StatusConflict, "Team membership already registered", errors.New("Team membership already exists for this user and team")}
			}
		}
	}

	membership := &portainer.TeamMembership{
		UserID: portainer.UserID(payload.UserID),
		TeamID: portainer.TeamID(payload.TeamID),
		Role:   portainer.MembershipRole(payload.Role),
	}

	err = handler.DataStore.TeamMembership().CreateTeamMembership(membership)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist team memberships inside the database", err}
	}

	return response.JSON(w, membership)
}
