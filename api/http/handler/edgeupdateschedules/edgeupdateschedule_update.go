package edgeupdateschedules

import (
	"errors"
	"net/http"
	"time"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edgetypes"
	"github.com/portainer/portainer/api/http/middlewares"
)

type updatePayload struct {
	Name         string
	GroupIDs     []portainer.EdgeGroupID
	Environments map[portainer.EndpointID]string
	Type         edgetypes.UpdateScheduleType
	Time         int64
}

func (payload *updatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("Invalid tag name")
	}

	if len(payload.GroupIDs) == 0 {
		return errors.New("Required to choose at least one group")
	}

	if payload.Type != edgetypes.UpdateScheduleRollback && payload.Type != edgetypes.UpdateScheduleUpdate {
		return errors.New("Invalid schedule type")
	}

	if len(payload.Environments) == 0 {
		return errors.New("No Environment is scheduled for update")
	}

	return nil
}

// @id EdgeUpdateScheduleUpdate
// @summary Updates an Edge Update Schedule
// @description **Access policy**: administrator
// @tags edge_update_schedules
// @security ApiKeyAuth
// @security jwt
// @accept json
// @param body body updatePayload true "Schedule details"
// @produce json
// @success 204
// @failure 500
// @router /edge_update_schedules [post]
func (handler *Handler) update(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	item, err := middlewares.FetchItem[edgetypes.UpdateSchedule](r, contextKey)
	if err != nil {
		return httperror.InternalServerError(err.Error(), err)
	}

	var payload updatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	if payload.Name != item.Name {
		err = handler.validateUniqueName(payload.Name, item.ID)
		if err != nil {
			return httperror.NewError(http.StatusConflict, "Edge update schedule name already in use", err)
		}

		item.Name = payload.Name
	}

	// if scheduled time didn't passed, then can update the schedule
	if item.Time > time.Now().Unix() {
		item.GroupIDs = payload.GroupIDs
		item.Time = payload.Time
		item.Type = payload.Type

		item.Status = map[portainer.EndpointID]edgetypes.UpdateScheduleStatus{}
		for environmentID, version := range payload.Environments {
			environment, err := handler.dataStore.Endpoint().Endpoint(environmentID)
			if err != nil {
				return httperror.InternalServerError("Unable to retrieve environment from the database", err)
			}

			if environment.Type != portainer.EdgeAgentOnDockerEnvironment {
				return httperror.BadRequest("Only standalone docker Environments are supported for remote update", nil)
			}

			item.Status[environmentID] = edgetypes.UpdateScheduleStatus{
				TargetVersion:  version,
				CurrentVersion: environment.Agent.Version,
			}
		}
	}

	err = handler.dataStore.EdgeUpdateSchedule().Update(item.ID, item)
	if err != nil {
		return httperror.InternalServerError("Unable to persist the edge update schedule", err)
	}

	return response.JSON(w, item)
}
