package endpointedge

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edgetypes"
	"github.com/sirupsen/logrus"
)

type versionUpdateResponse struct {
	// Target version
	Version string `json:"version" example:"2.14.3"`
	// Scheduled time
	ScheduledTime int64 `json:"scheduledTime" example:"1523232323"`
	// If need to update
	Active bool
	// Update schedule ID
	ScheduleID edgetypes.UpdateScheduleID `json:"scheduleId"`
}

func (handler *Handler) getVersionUpdateSchedule(endpoint *portainer.Endpoint, updateScheduleID int) versionUpdateResponse {
	updateSchedule := handler.DataStore.EdgeUpdateSchedule().ActiveSchedule(portainer.EndpointID(endpoint.ID))

	// update is successful
	if updateSchedule != nil && updateScheduleID != 0 && updateSchedule.ScheduleID == edgetypes.UpdateScheduleID(updateScheduleID) {
		err := handler.DataStore.EdgeUpdateSchedule().UpdateStatus(edgetypes.UpdateScheduleID(updateScheduleID), portainer.EndpointID(endpoint.ID), edgetypes.UpdateScheduleStatusSuccess, "")
		if err != nil {
			logrus.WithError(err).Warn("Unable to update active schedule")
		}

		return versionUpdateResponse{Active: false}
	}

	if updateSchedule == nil {
		logrus.WithField("endpointId", endpoint.ID).Debug("No update schedule found")
		return versionUpdateResponse{Active: false}
	}

	return versionUpdateResponse{
		Active:        true,
		Version:       updateSchedule.TargetVersion,
		ScheduledTime: updateSchedule.ScheduledTime,
		ScheduleID:    updateSchedule.ScheduleID,
	}
}
