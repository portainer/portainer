package edgeupdateschedules

import (
	"fmt"

	"github.com/pkg/errors"
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

func decorateSchedule(edgeStackGetter func(portainer.EdgeStackID) (*portainer.EdgeStack, error), schedule updateschedule.UpdateSchedule) (*decoratedUpdateSchedule, error) {
	edgeStack, err := edgeStackGetter(schedule.EdgeStackID)
	if err != nil {
		return nil, errors.WithMessage(err, "unable to get edge stack")
	}

	relatedEndpointIds := maps.Keys(schedule.EnvironmentsPreviousVersions)

	status, statusMessage := aggregateStatus(relatedEndpointIds, edgeStack)

	decoratedItem := &decoratedUpdateSchedule{
		UpdateSchedule: schedule,
		EdgeGroupIds:   edgeStack.EdgeGroups,
		Status:         status,
		StatusMessage:  statusMessage,
	}

	return decoratedItem, nil
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
