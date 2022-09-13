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
	ScheduledTime edgetypes.UpdateScheduleTime `json:"scheduledTime" example:"1523232323"`
	// If need to update
	Active bool
	// Update schedule ID
	ScheduleID edgetypes.UpdateScheduleID `json:"scheduleId"`
}

func (handler *Handler) setUpdateScheduleStatus(endpointID portainer.EndpointID, updateStatus edgetypes.VersionUpdateStatus) {
	// update is successful or failed
	if updateStatus.ScheduleID != 0 && updateStatus.Status != edgetypes.UpdateScheduleStatusPending {
		err := handler.DataStore.EdgeUpdateSchedule().UpdateStatus(updateStatus.ScheduleID, portainer.EndpointID(endpointID), updateStatus.Status, updateStatus.Error)
		if err != nil {
			logrus.WithError(err).Warn("Unable to update active schedule")
		}
	}
}

func (handler *Handler) getVersionUpdateSchedule(endpointID portainer.EndpointID, updateStatus edgetypes.VersionUpdateStatus) versionUpdateResponse {
	activeSchedule := handler.DataStore.EdgeUpdateSchedule().ActiveSchedule(endpointID)

	if activeSchedule == nil {
		logrus.WithField("endpointId", endpointID).Debug("No update schedule found")
		return versionUpdateResponse{Active: false}
	}

	return versionUpdateResponse{
		Active:        true,
		Version:       activeSchedule.TargetVersion,
		ScheduledTime: activeSchedule.ScheduledTime,
		ScheduleID:    activeSchedule.ScheduleID,
	}
}
