package teams

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
)

// @id TeamDelete
// @summary Remove a team
// @description Remove a team.
// @description **Access policy**: administrator
// @tags teams
// @security jwt
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Team not found"
// @failure 500 "Server error"
// @router /teams/{id} [delete]
func (handler *Handler) teamDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	teamID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid team identifier route variable", err}
	}

	_, err = handler.DataStore.Team().Team(portainer.TeamID(teamID))
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a team with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a team with the specified identifier inside the database", err}
	}

	err = handler.DataStore.Team().DeleteTeam(portainer.TeamID(teamID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to delete the team from the database", err}
	}

	err = handler.DataStore.TeamMembership().DeleteTeamMembershipByTeamID(portainer.TeamID(teamID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to delete associated team memberships from the database", err}
	}

	return response.Empty(w)
}
