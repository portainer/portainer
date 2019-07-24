package chisel

import (
	"fmt"
	"log"
	"strconv"
	"time"

	portainer "github.com/portainer/portainer/api"
)

// TODO: rename/refactor/add/review logging
func (service *Service) tunnelCleanup() {
	log.Printf("[DEBUG] [chisel, monitoring] [checkin_interval_seconds: %f] [message: starting agent checkin loop]", tunnelCleanupInterval.Seconds())
	ticker := time.NewTicker(tunnelCleanupInterval)
	quit := make(chan struct{})

	for {
		select {
		case <-ticker.C:
			for item := range service.tunnelDetailsMap.IterBuffered() {
				tunnel := item.Val.(*portainer.TunnelDetails)

				if tunnel.LastActivity.IsZero() || tunnel.Status == portainer.EdgeAgentIdle {
					continue
				}

				elapsed := time.Since(tunnel.LastActivity)

				log.Printf("[DEBUG] [chisel,monitoring] [endpoint_id: %s] [status: %s] [status_time_seconds: %f] [message: endpoint tunnel monitoring]", item.Key, tunnel.Status, elapsed.Seconds())

				if tunnel.Status == portainer.EdgeAgentManagementRequired && elapsed.Seconds() < requiredTimeout.Seconds() {
					continue
				} else if tunnel.Status == portainer.EdgeAgentManagementRequired && elapsed.Seconds() > requiredTimeout.Seconds() {
					log.Printf("[DEBUG] [chisel,monitoring] [endpoint_id: %s] [status: %s] [status_time_seconds: %f] [timeout_seconds: %f] [message: REQUIRED state timeout exceeded]", item.Key, tunnel.Status, elapsed.Seconds(), requiredTimeout.Seconds())
				}

				if tunnel.Status == portainer.EdgeAgentActive && elapsed.Seconds() < activeTimeout.Seconds() {
					continue
				} else if tunnel.Status == portainer.EdgeAgentActive && elapsed.Seconds() > activeTimeout.Seconds() {

					log.Printf("[DEBUG] [chisel,monitoring] [endpoint_id: %s] [status: %s] [status_time_seconds: %f] [timeout_seconds: %f] [message: ACTIVE state timeout exceeded. Triggering snapshot]", item.Key, tunnel.Status, elapsed.Seconds(), activeTimeout.Seconds())

					endpointID, err := strconv.Atoi(item.Key)
					if err != nil {
						log.Printf("[ERROR] [conversion] Unable to snapshot Edge endpoint (id: %s): %s", item.Key, err)
						continue
					}

					endpoint, err := service.endpointService.Endpoint(portainer.EndpointID(endpointID))
					if err != nil {
						log.Printf("[ERROR] [db] Unable to retrieve Edge endpoint information (id: %s): %s", item.Key, err)
						continue
					}

					endpointURL := endpoint.URL
					endpoint.URL = fmt.Sprintf("tcp://localhost:%d", tunnel.Port)
					snapshot, err := service.snapshotter.CreateSnapshot(endpoint)
					if err != nil {
						log.Printf("[ERROR] [snapshot] Unable to snapshot Edge endpoint (id: %s): %s", item.Key, err)
					}

					if snapshot != nil {
						endpoint.Snapshots = []portainer.Snapshot{*snapshot}
						endpoint.URL = endpointURL
						err = service.endpointService.UpdateEndpoint(endpoint.ID, endpoint)
						if err != nil {
							log.Printf("[ERROR] [db] Unable to persist snapshot for Edge endpoint (id: %s): %s", item.Key, err)
						}
					}
				}

				// TODO: to avoid iteration in a huge map and to keep that map
				// in a small state, should remove entry from map instead of putting IDLE, 0
				// NOTE: This cause a potential problem as it remove the schedules as well
				// Only remove if no schedules? And if not use existing set IDLE,0 ?

				//log.Println("[DEBUG] #1 INACTIVE TUNNEL")
				//service.tunnelDetailsMap.Remove(item.Key)
				endpointID, err := strconv.Atoi(item.Key)
				if err != nil {
					log.Printf("[ERROR] [conversion] Invalid endpoint identifier (id: %s): %s", item.Key, err)
					continue
				}

				service.SetIdleTunnel(portainer.EndpointID(endpointID))
			}

		case <-quit:
			log.Println("[DEBUG] [chisel, monitoring] [message: closing agent checkin loop]")
			ticker.Stop()
			return
		}
	}
}
