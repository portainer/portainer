package edgeupdateschedules

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edge/updateschedule"
	"github.com/stretchr/testify/assert"
)

func TestPreviousVersions(t *testing.T) {

	activeSchedulesMap := map[portainer.EndpointID]*updateschedule.EndpointUpdateScheduleRelation{}

	schedules := []updateschedule.UpdateSchedule{
		{
			ID:   1,
			Type: updateschedule.UpdateScheduleUpdate,
			EnvironmentsPreviousVersions: map[portainer.EndpointID]string{
				1: "2.11.0",

				2: "2.12.0",
			},
			Created: 1500000000,
		},
		{
			ID:   2,
			Type: updateschedule.UpdateScheduleRollback,
			EnvironmentsPreviousVersions: map[portainer.EndpointID]string{
				1: "2.14.0",
			},
			Created: 1500000001,
		},
		{
			ID:   3,
			Type: updateschedule.UpdateScheduleUpdate,
			EnvironmentsPreviousVersions: map[portainer.EndpointID]string{
				2: "2.13.0",
			},
			Created: 1500000002,
		},
	}

	actual := previousVersions(schedules, func(environmentID portainer.EndpointID) *updateschedule.EndpointUpdateScheduleRelation {
		return activeSchedulesMap[environmentID]
	})

	assert.Equal(t, map[portainer.EndpointID]string{
		2: "2.13.0",
	}, actual)

}
