package edgeupdateschedules

import (
	"fmt"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edge/updateschedule"
	"golang.org/x/exp/maps"
)

type decoratedUpdateSchedule struct {
	updateschedule.UpdateSchedule
	EdgeGroupIds  []portainer.EdgeGroupID                 `json:"edgeGroupIds"`
	Status        updateschedule.UpdateScheduleStatusType `json:"status"`
	StatusMessage string                                  `json:"statusMessage"`
}

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
		edgeStack, err := handler.dataStore.EdgeStack().EdgeStack(item.EdgeStackID)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve the edge stack", err)
		}

		relatedEndpointIds := maps.Keys(item.EnvironmentsPreviousVersions)

		status, statusMessage := aggregateStatus(relatedEndpointIds, edgeStack)

		decoratedItem := decoratedUpdateSchedule{
			UpdateSchedule: item,
			EdgeGroupIds:   edgeStack.EdgeGroups,
			Status:         status,
			StatusMessage:  statusMessage,
		}

		decoratedList[idx] = decoratedItem
	}
	return response.JSON(w, decoratedList)
}

func aggregateStatus(relatedEndpointIds []portainer.EndpointID, edgeStack *portainer.EdgeStack) (updateschedule.UpdateScheduleStatusType, string) {
	aggregatedStatus := struct {
		hasPending bool
		hasSent    bool
	}{}

	for _, endpointID := range relatedEndpointIds {
		envStatus, ok := edgeStack.Status[endpointID]

		if !ok || envStatus.Type == portainer.EdgeStackStatusPending {
			aggregatedStatus.hasPending = true
			continue
		}

		if envStatus.Type == portainer.StatusError {
			return updateschedule.UpdateScheduleStatusError, fmt.Sprintf("Error on environment %d: %s", endpointID, envStatus.Error)
		}

		if envStatus.Type == portainer.StatusAcknowledged {
			aggregatedStatus.hasSent = true
			break
		}

	}

	if aggregatedStatus.hasPending {
		return updateschedule.UpdateScheduleStatusPending, ""
	}

	if aggregatedStatus.hasSent {
		return updateschedule.UpdateScheduleStatusSent, ""
	}

	return updateschedule.UpdateScheduleStatusSuccess, ""
}
