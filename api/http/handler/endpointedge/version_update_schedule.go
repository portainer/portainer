package endpointedge

import (
	portaineree "github.com/portainer/portainer-ee/api"
	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

type versionUpdateResponse struct {
	// Target version
	Version string `json:"version" example:"2.14.3"`
	// Scheduled time
	ScheduledTime int64 `json:"scheduledTime" example:"1523232323"`
	// If need to update
	Active bool
}

func (handler *Handler) getVersionUpdateSchedule(endpoint *portaineree.Endpoint) versionUpdateResponse {
	updateSchedule := handler.DataStore.EdgeUpdateSchedule().ActiveSchedule(portainer.EndpointID(endpoint.ID))

	if updateSchedule == nil {
		logrus.WithField("endpointId", endpoint.ID).Debug("No update schedule found")
		return versionUpdateResponse{Active: false}
	}

	return versionUpdateResponse{
		Active:        true,
		Version:       updateSchedule.TargetVersion,
		ScheduledTime: updateSchedule.ScheduledTime,
	}
}
