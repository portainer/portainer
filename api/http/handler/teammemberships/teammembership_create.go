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
	// User identifier
	UserID int `validate:"required" example:"1"`
	// Team identifier
	TeamID int `validate:"required" example:"1"`
	// Role for the user inside the team (1 for leader and 2 for regular member)
	Role int `validate:"required" example:"1" enums:"1,2"`
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

// @id TeamMembershipCreate
// @summary Create a new team membership
// @description Create a new team memberships. Access is only available to administrators leaders of the associated team.
// @description **Access policy**: admin
// @tags team_memberships
// @security jwt
// @accept json
// @produce json
// @param body body teamMembershipCreatePayload true "Team membership details"
// @success 200 {object} portainer.TeamMembership "Success"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to manage memberships"
// @failure 409 "Team membership already registered"
// @failure 500 "Server error"
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
