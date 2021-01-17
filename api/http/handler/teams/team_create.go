package teams

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
)

type teamCreatePayload struct {
	Name string
}

func (payload *teamCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("Invalid team name")
	}
	return nil
}

// @summary Create Team
// @description
// @tags teams
// @security jwt
// @accept json
// @produce json
// @param body body teamCreatePayload true "team data"
// @success 200 {object} portainer.Team "Team"
// @failure 500,400,409
// @router /team [post]
func (handler *Handler) teamCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload teamCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	team, err := handler.DataStore.Team().TeamByName(payload.Name)
	if err != nil && err != bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve teams from the database", err}
	}
	if team != nil {
		return &httperror.HandlerError{http.StatusConflict, "A team with the same name already exists", errors.New("Team already exists")}
	}

	team = &portainer.Team{
		Name: payload.Name,
	}

	err = handler.DataStore.Team().CreateTeam(team)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the team inside the database", err}
	}

	return response.JSON(w, team)
}
