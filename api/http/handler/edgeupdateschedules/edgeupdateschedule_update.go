package edgeupdateschedules

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edge/updateschedule"
	"github.com/portainer/portainer/api/http/middlewares"
)

type updatePayload struct {
	Name     string
	GroupIDs []portainer.EdgeGroupID
	Type     updateschedule.UpdateScheduleType
	Version  string
	// Time     int64
}

func (payload *updatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("invalid tag name")
	}

	if len(payload.GroupIDs) == 0 {
		return errors.New("required to choose at least one group")
	}

	if payload.Type != updateschedule.UpdateScheduleRollback && payload.Type != updateschedule.UpdateScheduleUpdate {
		return errors.New("invalid schedule type")
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
	item, err := middlewares.FetchItem[updateschedule.UpdateSchedule](r, contextKey)
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

	stack, err := handler.dataStore.EdgeStack().EdgeStack(item.EdgeStackID)
	if err != nil {
		return httperror.NewError(http.StatusInternalServerError, "Unable to retrieve Edge stack", err)
	}

	canUpdate := true
	for _, environmentStatus := range stack.Status {
		if environmentStatus.Type != portainer.EdgeStackStatusPending {
			canUpdate = false
		}
	}

	if canUpdate {
		err := handler.dataStore.EdgeStack().DeleteEdgeStack(item.EdgeStackID)
		if err != nil {
			return httperror.NewError(http.StatusInternalServerError, "Unable to delete Edge stack", err)
		}

		stackID, err := handler.createUpdateEdgeStack(item.ID, item.Name, payload.GroupIDs, payload.Version)
		if err != nil {
			return httperror.NewError(http.StatusInternalServerError, "Unable to create Edge stack", err)
		}

		item.EdgeStackID = stackID
	}

	err = handler.dataStore.EdgeUpdateSchedule().Update(item.ID, item)
	if err != nil {
		return httperror.InternalServerError("Unable to persist the edge update schedule", err)
	}

	return response.JSON(w, item)
}
