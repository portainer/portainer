package edgeupdateschedules

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edge/updateschedule"
	"github.com/stretchr/testify/assert"
)

func TestPreviousVersions(t *testing.T) {

	schedules := []updateschedule.UpdateSchedule{
		{
			ID:   1,
			Type: updateschedule.UpdateScheduleUpdate,
			Status: map[portainer.EndpointID]updateschedule.UpdateScheduleStatus{
				1: {
					TargetVersion:  "2.14.0",
					CurrentVersion: "2.11.0",
					Status:         updateschedule.UpdateScheduleStatusSuccess,
				},
				2: {
					TargetVersion:  "2.13.0",
					CurrentVersion: "2.12.0",
					Status:         updateschedule.UpdateScheduleStatusSuccess,
				},
			},
			Created: 1500000000,
		},
		{
			ID:   2,
			Type: updateschedule.UpdateScheduleRollback,
			Status: map[portainer.EndpointID]updateschedule.UpdateScheduleStatus{
				1: {
					TargetVersion:  "2.11.0",
					CurrentVersion: "2.14.0",
					Status:         updateschedule.UpdateScheduleStatusSuccess,
				},
			},
			Created: 1500000001,
		},
		{
			ID:   3,
			Type: updateschedule.UpdateScheduleUpdate,
			Status: map[portainer.EndpointID]updateschedule.UpdateScheduleStatus{
				2: {
					TargetVersion:  "2.14.0",
					CurrentVersion: "2.13.0",
					Status:         updateschedule.UpdateScheduleStatusSuccess,
				},
			},
			Created: 1500000002,
		},
	}

	actual := previousVersions(schedules)

	assert.Equal(t, map[portainer.EndpointID]string{
		2: "2.13.0",
	}, actual)

}
