package teams

import (
	"net/http"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type teamUpdatePayload struct {
	Name string
}

func (payload *teamUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/teams/:id
func (handler *Handler) teamUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	teamID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid team identifier route variable", err}
	}

	var payload teamUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	team, err := handler.TeamService.Team(portainer.TeamID(teamID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a team with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a team with the specified identifier inside the database", err}
	}

	if payload.Name != "" {
		team.Name = payload.Name
	}

	err = handler.TeamService.UpdateTeam(team.ID, team)
	if err != nil {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to persist team changes inside the database", err}
	}

	return response.JSON(w, team)
}
