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

// @id TeamMemberships
// @summary List team memberships
// @description List team memberships. Access is only available to administrators and team leaders.
// @description **Access policy**: restricted
// @tags team_memberships
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Team Id"
// @success 200 {array} portainer.TeamMembership "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 500 "Server error"
// @router /teams/{id}/memberships [get]
func (handler *Handler) teamMemberships(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	teamID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid team identifier route variable", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	if !security.AuthorizedTeamManagement(portainer.TeamID(teamID), securityContext) {
		return httperror.Forbidden("Access denied to team", errors.ErrResourceAccessDenied)
	}

	memberships, err := handler.DataStore.TeamMembership().TeamMembershipsByTeamID(portainer.TeamID(teamID))
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve associated team memberships from the database", err)
	}

	return response.JSON(w, memberships)
}
