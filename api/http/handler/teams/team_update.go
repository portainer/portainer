package teams

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type teamUpdatePayload struct {
	// Name
	Name string `example:"developers"`
}

func (payload *teamUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// @id TeamUpdate
// @summary Update a team
// @description Update a team.
// @description **Access policy**: administrator
// @tags teams
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Team identifier"
// @param body body teamUpdatePayload true "Team details"
// @success 200 {object} portainer.Team "Success"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Team not found"
// @failure 500 "Server error"
// @router /teams/{id} [put]
func (handler *Handler) teamUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	teamID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid team identifier route variable", err)
	}

	var payload teamUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	team, err := handler.DataStore.Team().Read(portainer.TeamID(teamID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a team with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a team with the specified identifier inside the database", err)
	}

	if payload.Name != "" {
		team.Name = payload.Name
	}

	err = handler.DataStore.Team().Update(team.ID, team)
	if err != nil {
		return httperror.NotFound("Unable to persist team changes inside the database", err)
	}

	return response.JSON(w, team)
}
