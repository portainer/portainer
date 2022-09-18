package edgeupdateschedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type activeSchedulePayload struct {
	EnvironmentIDs []portainer.EndpointID
}

func (payload *activeSchedulePayload) Validate(r *http.Request) error {
	return nil
}

// @id EdgeUpdateScheduleActiveSchedulesList
// @summary Fetches the list of Active Edge Update Schedules
// @description **Access policy**: administrator
// @tags edge_update_schedules
// @security ApiKeyAuth
// @security jwt
// @accept json
// @param body body activeSchedulePayload true "Active schedule query"
// @produce json
// @success 200 {array} edgetypes.EdgeUpdateSchedule
// @failure 500
// @router /edge_update_schedules/active [get]
func (handler *Handler) activeSchedules(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload activeSchedulePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	list := handler.dataStore.EdgeUpdateSchedule().ActiveSchedules(payload.EnvironmentIDs)

	return response.JSON(w, list)
}
