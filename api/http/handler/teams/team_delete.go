package teams

import (
	"net/http"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

// @id TeamDelete
// @summary Remove a team
// @description Remove a team.
// @description **Access policy**: administrator
// @tags teams
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Team Id"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Team not found"
// @failure 500 "Server error"
// @router /teams/{id} [delete]
func (handler *Handler) teamDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	teamID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid team identifier route variable", err)
	}

	_, err = handler.DataStore.Team().Read(portainer.TeamID(teamID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a team with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a team with the specified identifier inside the database", err)
	}

	err = handler.DataStore.Team().Delete(portainer.TeamID(teamID))
	if err != nil {
		return httperror.InternalServerError("Unable to delete the team from the database", err)
	}

	err = handler.DataStore.TeamMembership().DeleteTeamMembershipByTeamID(portainer.TeamID(teamID))
	if err != nil {
		return httperror.InternalServerError("Unable to delete associated team memberships from the database", err)
	}

	// update default team if deleted team was default
	err = handler.updateDefaultTeamIfDeleted(portainer.TeamID(teamID))
	if err != nil {
		return httperror.InternalServerError("Unable to reset default team", err)
	}

	return response.Empty(w)
}

// updateDefaultTeamIfDeleted resets the default team to nil if default team was the deleted team
func (handler *Handler) updateDefaultTeamIfDeleted(teamID portainer.TeamID) error {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return errors.Wrap(err, "failed to fetch settings")
	}

	if teamID != settings.OAuthSettings.DefaultTeamID {
		return nil
	}

	settings.OAuthSettings.DefaultTeamID = 0
	err = handler.DataStore.Settings().UpdateSettings(settings)
	return errors.Wrap(err, "failed to update settings")
}
