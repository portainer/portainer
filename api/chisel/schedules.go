package chisel

import (
	"strconv"

	portainer "github.com/portainer/portainer/api"
)

func (service *Service) AddSchedule(endpointID portainer.EndpointID, schedule *portainer.EdgeSchedule) {
	key := strconv.Itoa(int(endpointID))

	// TODO: use GetTunnelDetails?
	var tunnelDetails *portainer.TunnelDetails
	item, ok := service.tunnelDetailsMap.Get(key)
	if ok {
		tunnelDetails = item.(*portainer.TunnelDetails)

		existingScheduleIndex := -1
		for idx, existingSchedule := range tunnelDetails.Schedules {
			if existingSchedule.ID == schedule.ID {
				existingScheduleIndex = idx
				break
			}
		}

		if existingScheduleIndex == -1 {
			tunnelDetails.Schedules = append(tunnelDetails.Schedules, *schedule)
		} else {
			tunnelDetails.Schedules[existingScheduleIndex] = *schedule
		}

	} else {
		tunnelDetails = &portainer.TunnelDetails{Status: portainer.EdgeAgentIdle, Schedules: []portainer.EdgeSchedule{*schedule}}
	}

	service.tunnelDetailsMap.Set(key, tunnelDetails)
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
