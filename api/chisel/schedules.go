package chisel

import (
	"strconv"

	portainer "github.com/portainer/portainer/api"
)

func (service *Service) AddSchedule(endpointID portainer.EndpointID, schedule *portainer.EdgeSchedule) {
	tunnel := service.GetTunnelDetails(endpointID)

	existingScheduleIndex := -1
	for idx, existingSchedule := range tunnel.Schedules {
		if existingSchedule.ID == schedule.ID {
			existingScheduleIndex = idx
			break
		}
	}

	if existingScheduleIndex == -1 {
		tunnel.Schedules = append(tunnel.Schedules, *schedule)
	} else {
		tunnel.Schedules[existingScheduleIndex] = *schedule
	}

	key := strconv.Itoa(int(endpointID))
	service.tunnelDetailsMap.Set(key, tunnel)
}

func (service *Service) RemoveSchedule(scheduleID portainer.ScheduleID) {
	for item := range service.tunnelDetailsMap.IterBuffered() {
		tunnelDetails := item.Val.(*portainer.TunnelDetails)

		updatedSchedules := make([]portainer.EdgeSchedule, 0)
		for _, schedule := range tunnelDetails.Schedules {
			if schedule.ID == scheduleID {
				continue
			}
			updatedSchedules = append(updatedSchedules, schedule)
		}

		tunnelDetails.Schedules = updatedSchedules
		service.tunnelDetailsMap.Set(item.Key, tunnelDetails)
	}
}
