package edgeupdateschedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// @id EdgeUpdateScheduleList
// @summary Fetches the list of Edge Update Schedules
// @description **Access policy**: administrator
// @tags edge_update_schedules
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {array} edgetypes.UpdateSchedule
// @failure 500
// @router /edge_update_schedules [get]
func (handler *Handler) list(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	list, err := handler.dataStore.EdgeUpdateSchedule().List()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve the edge update schedules list", err)
	}

	return response.JSON(w, list)
}
