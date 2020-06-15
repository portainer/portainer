package teams

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/errors"
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

	team, err := handler.DataStore.Team().Team(portainer.TeamID(teamID))
	if err.Error() == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a team with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a team with the specified identifier inside the database", err}
	}

	if payload.Name != "" {
		team.Name = payload.Name
	}

	err = handler.DataStore.Team().UpdateTeam(team.ID, team)
	if err != nil {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to persist team changes inside the database", err}
	}

	return response.JSON(w, team)
}
