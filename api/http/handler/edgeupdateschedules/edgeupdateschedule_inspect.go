package edgeupdateschedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/edge/updateschedule"
	"github.com/portainer/portainer/api/http/middlewares"
)

// @id EdgeUpdateScheduleInspect
// @summary Returns the Edge Update Schedule with the given ID
// @description **Access policy**: administrator
// @tags edge_update_schedules
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {object} decoratedUpdateSchedule
// @failure 500
// @router /edge_update_schedules/{id} [get]
func (handler *Handler) inspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	item, err := middlewares.FetchItem[updateschedule.UpdateSchedule](r, contextKey)
	if err != nil {
		return httperror.InternalServerError(err.Error(), err)
	}

	includeEdgeStack, _ := request.RetrieveBooleanQueryParameter(r, "includeEdgeStack", true)
	if !includeEdgeStack {
		return response.JSON(w, item)
	}

	decoratedItem, err := decorateSchedule(handler.dataStore.EdgeStack().EdgeStack, *item)
	if err != nil {
		return httperror.InternalServerError("Unable to decorate the edge update schedule", err)
	}

	return response.JSON(w, decoratedItem)
}
