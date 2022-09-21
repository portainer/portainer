package edgeupdateschedules

import (
	"fmt"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edge/updateschedule"
	"github.com/portainer/portainer/api/http/middlewares"
)

type decoratedUpdateSchedule struct {
	updateschedule.UpdateSchedule
	EdgeGroupIds  []portainer.EdgeGroupID                 `json:"edgeGroupIds"`
	Status        updateschedule.UpdateScheduleStatusType `json:"status"`
	StatusMessage string                                  `json:"statusMessage"`
}

func decorateSchedule(schedule updateschedule.UpdateSchedule, edgeStackGetter middlewares.ItemGetter[portainer.EdgeStackID, portainer.EdgeStack], environmentGetter middlewares.ItemGetter[portainer.EndpointID, portainer.Endpoint]) (*decoratedUpdateSchedule, error) {
	edgeStack, err := edgeStackGetter(schedule.EdgeStackID)
	if err != nil {
		return nil, errors.WithMessage(err, "unable to get edge stack")
	}

	status, statusMessage := aggregateStatus(schedule.EnvironmentsPreviousVersions, edgeStack, environmentGetter)

	decoratedItem := &decoratedUpdateSchedule{
		UpdateSchedule: schedule,
		EdgeGroupIds:   edgeStack.EdgeGroups,
		Status:         status,
		StatusMessage:  statusMessage,
	}

	return decoratedItem, nil
}

func aggregateStatus(previousVersions map[portainer.EndpointID]string, edgeStack *portainer.EdgeStack, environmentGetter middlewares.ItemGetter[portainer.EndpointID, portainer.Endpoint]) (updateschedule.UpdateScheduleStatusType, string) {
	aggregatedStatus := struct {
		hasPending bool
		hasSent    bool
	}{}

	for endpointID, previousVersion := range previousVersions {
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

		// TODO some times when edge stacks fail, they will report ok, but the version will not be updated
		if envStatus.Type == portainer.StatusOk {

			// check if environment was updated
			environment, err := environmentGetter(endpointID)
			if err != nil {
				return updateschedule.UpdateScheduleStatusError, fmt.Sprintf("Error on environment %d: %s", endpointID, err)
			}

			if environment.Agent.Version == previousVersion {
				return updateschedule.UpdateScheduleStatusError, fmt.Sprintf("environment %d did not update", endpointID)
			}
		}

		// status is "success update"

	}

	if aggregatedStatus.hasPending {
		return updateschedule.UpdateScheduleStatusPending, ""
	}

	if aggregatedStatus.hasSent {
		return updateschedule.UpdateScheduleStatusSent, ""
	}

	return updateschedule.UpdateScheduleStatusSuccess, ""
}
