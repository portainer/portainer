package teams

import (
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type teamCreatePayload struct {
	// Name
	Name string `example:"developers" validate:"required"`
	// TeamLeaders
	TeamLeaders []portainer.UserID `example:"3,5"`
}

func (payload *teamCreatePayload) Validate(r *http.Request) error {
	if len(payload.Name) == 0 {
		return errors.New("Invalid team name")
	}
	return nil
}

// @id TeamCreate
// @summary Create a new team
// @description Create a new team.
// @description **Access policy**: administrator
// @tags teams
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body teamCreatePayload true "details"
// @success 200 {object} portainer.Team "Success"
// @failure 400 "Invalid request"
// @failure 409 "A team with the same name already exists"
// @failure 500 "Server error"
// @router /teams [post]
func (handler *Handler) teamCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload teamCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	team, err := handler.DataStore.Team().TeamByName(payload.Name)
	if err != nil && !handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.InternalServerError("Unable to retrieve teams from the database", err)
	}
	if team != nil {
		return httperror.Conflict("A team with the same name already exists", errors.New("Team already exists"))
	}

	team = &portainer.Team{
		Name: payload.Name,
	}

	err = handler.DataStore.Team().Create(team)
	if err != nil {
		return httperror.InternalServerError("Unable to persist the team inside the database", err)
	}

	for _, teamLeader := range payload.TeamLeaders {
		membership := &portainer.TeamMembership{
			UserID: teamLeader,
			TeamID: team.ID,
			Role:   portainer.TeamLeader,
		}

		err = handler.DataStore.TeamMembership().Create(membership)
		if err != nil {
			return httperror.InternalServerError("Unable to persist team leadership inside the database", err)
		}
	}

	return response.JSON(w, team)
}
