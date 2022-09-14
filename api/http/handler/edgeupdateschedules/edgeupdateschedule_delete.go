package edgeupdateschedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/edgetypes"
	"github.com/portainer/portainer/api/http/middlewares"
)

// @id EdgeUpdateScheduleDelete
// @summary Deletes an Edge Update Schedule
// @description **Access policy**: administrator
// @tags edge_update_schedules
// @security ApiKeyAuth
// @security jwt
// @success 204
// @failure 500
// @router /edge_update_schedules/{id} [delete]
func (handler *Handler) delete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	item, err := middlewares.FetchItem[edgetypes.UpdateSchedule](r, contextKey)
	if err != nil {
		return httperror.InternalServerError(err.Error(), err)
	}

	err = handler.dataStore.EdgeUpdateSchedule().Delete(item.ID)
	if err != nil {
		return httperror.InternalServerError("Unable to delete the edge update schedule", err)
	}

	return response.Empty(w)
}
