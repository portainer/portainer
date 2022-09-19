package edgeupdateschedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

// @id EdgeUpdateScheduleList
// @summary Fetches the list of Edge Update Schedules
// @description **Access policy**: administrator
// @tags edge_update_schedules
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {array} decoratedUpdateSchedule
// @failure 500
// @router /edge_update_schedules [get]
func (handler *Handler) list(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	list, err := handler.dataStore.EdgeUpdateSchedule().List()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve the edge update schedules list", err)
	}

	includeEdgeStacks, _ := request.RetrieveBooleanQueryParameter(r, "includeEdgeStacks", true)

	if !includeEdgeStacks {
		return response.JSON(w, list)

	}

	decoratedList := make([]decoratedUpdateSchedule, len(list))
	for idx, item := range list {
		decoratedItem, err := decorateSchedule(handler.dataStore.EdgeStack().EdgeStack, item)
		if err != nil {
			return httperror.InternalServerError("Unable to decorate the edge update schedule", err)
		}

		decoratedList[idx] = *decoratedItem
	}
	return response.JSON(w, decoratedList)
}
