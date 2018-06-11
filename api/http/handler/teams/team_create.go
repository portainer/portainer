package teams

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type teamCreatePayload struct {
	Name string
}

func (payload *teamCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid team name")
	}
	return nil
}

func (handler *Handler) teamCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload teamCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	team, err := handler.TeamService.TeamByName(payload.Name)
	if err != nil && err != portainer.ErrTeamNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve teams from the database", err}
	}
	if team != nil {
		return &httperror.HandlerError{http.StatusConflict, "A team with the same name already exists", portainer.ErrTeamAlreadyExists}
	}

	team = &portainer.Team{
		Name: payload.Name,
	}

	err = handler.TeamService.CreateTeam(team)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the team inside the database", err}
	}

	return response.JSON(w, team)
}
