package edgeupdateschedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

// @id EdgeUpdateScheduleInspect
// @summary Returns the Edge Update Schedule with the given ID
// @description **Access policy**: administrator
// @tags edge_update_schedules
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {object} portainer.EdgeUpdateSchedule
// @failure 500
// @router /edge_update_schedules/{id} [get]
func (handler *Handler) inspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	item, err := FetchItem[portainer.EdgeUpdateSchedule](r)
	if err != nil {
		return httperror.InternalServerError(err.Error(), err)
	}

	return response.JSON(w, item)
}
