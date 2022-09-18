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
	"github.com/portainer/portainer/api/http/security"
)

type createPayload struct {
	Name         string
	GroupIDs     []portainer.EdgeGroupID
	Type         edgetypes.UpdateScheduleType
	Environments map[portainer.EndpointID]string
	Time         int64
}

func (payload *createPayload) Validate(r *http.Request) error {
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

	if payload.Time < time.Now().Unix() {
		return errors.New("Invalid time")
	}

	return nil
}

// @id EdgeUpdateScheduleCreate
// @summary Creates a new Edge Update Schedule
// @description **Access policy**: administrator
// @tags edge_update_schedules
// @security ApiKeyAuth
// @security jwt
// @accept json
// @param body body createPayload true "Schedule details"
// @produce json
// @success 200 {object} edgetypes.UpdateSchedule
// @failure 500
// @router /edge_update_schedules [post]
func (handler *Handler) create(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	var payload createPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	err = handler.validateUniqueName(payload.Name, 0)
	if err != nil {
		return httperror.NewError(http.StatusConflict, "Edge update schedule name already in use", err)

	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user information from token", err)
	}

	item := &edgetypes.UpdateSchedule{
		Name:      payload.Name,
		Time:      payload.Time,
		GroupIDs:  payload.GroupIDs,
		Status:    map[portainer.EndpointID]edgetypes.UpdateScheduleStatus{},
		Created:   time.Now().Unix(),
		CreatedBy: tokenData.ID,
		Type:      payload.Type,
	}

	schedules, err := handler.dataStore.EdgeUpdateSchedule().List()
	if err != nil {
		return httperror.InternalServerError("Unable to list edge update schedules", err)
	}

	prevVersions := map[portainer.EndpointID]string{}
	if item.Type == edgetypes.UpdateScheduleRollback {
		prevVersions = previousVersions(schedules)
	}

	for environmentID, version := range payload.Environments {
		environment, err := handler.dataStore.Endpoint().Endpoint(environmentID)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve environment from the database", err)
		}

		// TODO check that env is standalone (snapshots)
		if environment.Type != portainer.EdgeAgentOnDockerEnvironment {
			return httperror.BadRequest("Only standalone docker Environments are supported for remote update", nil)
		}

		// validate version id is valid for rollback
		if item.Type == edgetypes.UpdateScheduleRollback {
			if prevVersions[environmentID] == "" {
				return httperror.BadRequest("No previous version found for environment", nil)
			}

			if version != prevVersions[environmentID] {
				return httperror.BadRequest("Rollback version must match previous version", nil)
			}
		}

		item.Status[environmentID] = edgetypes.UpdateScheduleStatus{
			TargetVersion:  version,
			CurrentVersion: environment.Agent.Version,
		}
	}

	err = handler.dataStore.EdgeUpdateSchedule().Create(item)
	if err != nil {
		return httperror.InternalServerError("Unable to persist the edge update schedule", err)
	}

	return response.JSON(w, item)
}
