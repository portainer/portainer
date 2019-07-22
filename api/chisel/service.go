package chisel

import (
	"fmt"
	"log"
	"math/rand"
	"strconv"
	"strings"
	"time"

	"github.com/dchest/uniuri"

	cmap "github.com/orcaman/concurrent-map"

	chserver "github.com/jpillora/chisel/server"
	portainer "github.com/portainer/portainer/api"
)

// Dynamic ports (also called private ports) are 49152 to 65535.
const (
	minAvailablePort      = 49152
	maxAvailablePort      = 65535
	tunnelCleanupInterval = 10 * time.Second
	requiredTimeout       = 15 * time.Second
	activeTimeout         = 5 * time.Minute
)

type Service struct {
	serverFingerprint string
	serverPort        string
	tunnelDetailsMap  cmap.ConcurrentMap
	endpointService   portainer.EndpointService
	snapshotter       portainer.Snapshotter
	chiselServer      *chserver.Server
}

//TODO: document
func NewService(endpointService portainer.EndpointService) *Service {
	return &Service{
		tunnelDetailsMap: cmap.New(),
		endpointService:  endpointService,
	}
}

func (service *Service) SetupSnapshotter(snapshotter portainer.Snapshotter) {
	service.snapshotter = snapshotter
}

func (service *Service) StartTunnelServer(addr, port string) error {
	// TODO: keyseed management (persistence)
	config := &chserver.Config{
		Reverse: true,
		KeySeed: "keyseedexample",
	}

	chiselServer, err := chserver.NewServer(config)
	if err != nil {
		return err
	}

	service.serverFingerprint = chiselServer.GetFingerprint()
	service.serverPort = port

	err = chiselServer.Start(addr, port)
	if err != nil {
		return err
	}

	service.chiselServer = chiselServer
	go service.tunnelCleanup()

	return nil
}

func (service *Service) GetServerFingerprint() string {
	return service.serverFingerprint
}

func (service *Service) GetServerPort() string {
	return service.serverPort
}

// TODO: rename/refactor/add/review logging
func (service *Service) tunnelCleanup() {
	log.Printf("[DEBUG] [chisel, monitoring] [checkin_interval_seconds: %f] [message: starting agent checkin loop]", tunnelCleanupInterval.Seconds())
	ticker := time.NewTicker(tunnelCleanupInterval)
	quit := make(chan struct{})

	for {
		select {
		case <-ticker.C:
			for item := range service.tunnelDetailsMap.IterBuffered() {
				tunnel := item.Val.(portainer.TunnelDetails)

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

				// TODO: to avoid iteration in a mega map and to keep that map
				// in a small state, should remove entry from map instead of putting IDLE, 0
				// NOTE: This cause a potential problem as it remove the schedules as well
				// Only remove if no schedules? And if not use existing set IDLE,0 ?

				//log.Println("[DEBUG] #1 INACTIVE TUNNEL")
				//service.tunnelDetailsMap.Remove(item.Key)

				tunnel.Status = portainer.EdgeAgentIdle
				tunnel.Port = 0
				tunnel.LastActivity = time.Now()

				credentials := tunnel.Credentials
				tunnel.Credentials = ""
				service.chiselServer.DeleteUser(strings.Split(credentials, ":")[0])

				log.Printf("[DEBUG] [chisel,monitoring] [endpoint_id: %s] [status: %s] [message: updating tunnel status]", item.Key, tunnel.Status)
				service.tunnelDetailsMap.Set(item.Key, tunnel)
			}

		case <-quit:
			log.Println("[DEBUG] [chisel, monitoring] [message: closing agent checkin loop]")
			ticker.Stop()
			return
		}
	}
}

func (service *Service) getUnusedPort() int {
	port := randomInt(minAvailablePort, maxAvailablePort)

	for item := range service.tunnelDetailsMap.IterBuffered() {
		value := item.Val.(portainer.TunnelDetails)
		if value.Port == port {
			return service.getUnusedPort()
		}
	}

	return port
}

func (service *Service) GetTunnelDetails(endpointID portainer.EndpointID) *portainer.TunnelDetails {
	key := strconv.Itoa(int(endpointID))

	if item, ok := service.tunnelDetailsMap.Get(key); ok {
		tunnelDetails := item.(portainer.TunnelDetails)
		return &tunnelDetails
	}

	schedules := make([]portainer.EdgeSchedule, 0)
	return &portainer.TunnelDetails{
		Status:    portainer.EdgeAgentIdle,
		Port:      0,
		Schedules: schedules,
	}
}

func (service *Service) UpdateTunnelState(endpointID portainer.EndpointID, state string) {
	key := strconv.Itoa(int(endpointID))

	var tunnelDetails portainer.TunnelDetails
	item, ok := service.tunnelDetailsMap.Get(key)
	if ok {
		tunnelDetails = item.(portainer.TunnelDetails)
		if tunnelDetails.Status != state || (tunnelDetails.Status == portainer.EdgeAgentActive && state == portainer.EdgeAgentActive) {
			tunnelDetails.LastActivity = time.Now()
		}
		tunnelDetails.Status = state
	} else {
		tunnelDetails = portainer.TunnelDetails{Status: state, Schedules: []portainer.EdgeSchedule{}}
	}

	if state == portainer.EdgeAgentManagementRequired && tunnelDetails.Port == 0 {
		tunnelDetails.Port = service.getUnusedPort()
		username, password := generateRandomCredentials()
		tunnelDetails.Credentials = fmt.Sprintf("%s:%s", username, password)
		service.chiselServer.AddUser(username, password, "")
	}

	log.Printf("[DEBUG] [chisel,monitoring] [endpoint_id: %s] [status: %s] [status_time_seconds: %f] [message: updating tunnel status]", key, tunnelDetails.Status, time.Since(tunnelDetails.LastActivity).Seconds())

	service.tunnelDetailsMap.Set(key, tunnelDetails)
}

func generateRandomCredentials() (string, string) {
	username := uniuri.NewLen(8)
	password := uniuri.NewLen(8)
	return username, password
}

func (service *Service) ResetTunnelActivityTimer(endpointID portainer.EndpointID) {
	key := strconv.Itoa(int(endpointID))

	var tunnelDetails portainer.TunnelDetails
	item, ok := service.tunnelDetailsMap.Get(key)
	if ok {
		tunnelDetails = item.(portainer.TunnelDetails)
		tunnelDetails.LastActivity = time.Now()
		service.tunnelDetailsMap.Set(key, tunnelDetails)
		log.Printf("[DEBUG] [chisel,monitoring] [endpoint_id: %s] [status: %s] [status_time_seconds: %f] [message: updating tunnel status timer]", key, tunnelDetails.Status, time.Since(tunnelDetails.LastActivity).Seconds())
	}
}

func (service *Service) AddSchedule(endpointID portainer.EndpointID, schedule *portainer.EdgeSchedule) {
	key := strconv.Itoa(int(endpointID))

	var tunnelDetails portainer.TunnelDetails
	item, ok := service.tunnelDetailsMap.Get(key)
	if ok {
		tunnelDetails = item.(portainer.TunnelDetails)

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
		tunnelDetails = portainer.TunnelDetails{Status: portainer.EdgeAgentIdle, Schedules: []portainer.EdgeSchedule{*schedule}}
	}

	log.Printf("[DEBUG] #4 ADDING SCHEDULE %d | %s", schedule.ID, schedule.CronExpression)
	service.tunnelDetailsMap.Set(key, tunnelDetails)
}

func (service *Service) RemoveSchedule(scheduleID portainer.ScheduleID) {
	for item := range service.tunnelDetailsMap.IterBuffered() {
		tunnelDetails := item.Val.(portainer.TunnelDetails)

		updatedSchedules := make([]portainer.EdgeSchedule, 0)
		for _, schedule := range tunnelDetails.Schedules {
			if schedule.ID == scheduleID {
				log.Printf("[DEBUG] #5 REMOVING SCHEDULE %d", scheduleID)
				continue
			}
			updatedSchedules = append(updatedSchedules, schedule)
		}

		tunnelDetails.Schedules = updatedSchedules
		service.tunnelDetailsMap.Set(item.Key, tunnelDetails)
	}
}

func randomInt(min, max int) int {
	return min + rand.Intn(max-min)
}
