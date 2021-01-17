package teams

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

// @summary List team's memberships
// @description
// @tags teams
// @security jwt
// @accept json
// @produce json
// @param id path string true "team id"
// @success 200 {array} portainer.TeamMembership "Team memberships"
// @failure 500,400,403
// @router /teams/{id}/memberships [get]
func (handler *Handler) teamMemberships(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	teamID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid team identifier route variable", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if !security.AuthorizedTeamManagement(portainer.TeamID(teamID), securityContext) {
		return &httperror.HandlerError{http.StatusForbidden, "Access denied to team", errors.ErrResourceAccessDenied}
	}

	memberships, err := handler.DataStore.TeamMembership().TeamMembershipsByTeamID(portainer.TeamID(teamID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve associated team memberships from the database", err}
	}

	return response.JSON(w, memberships)
}
