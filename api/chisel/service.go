package chisel

import (
	"fmt"
	"log"
	"math/rand"
	"strconv"
	"time"

	cmap "github.com/orcaman/concurrent-map"

	chserver "github.com/jpillora/chisel/server"
	portainer "github.com/portainer/portainer/api"
)

// Dynamic ports (also called private ports) are 49152 to 65535.
const (
	minAvailablePort = 49152
	maxAvailablePort = 65535
	// TODO: configurable? change defaults?
	inactivityTimerDuration = 5 * time.Minute
	tunnelCleanupInterval   = 10 * time.Second
)

type TunnelStatus struct {
	state        string
	port         int
	lastActivity time.Time
	schedules    []portainer.EdgeSchedule
}

type Service struct {
	serverFingerprint string
	serverPort        string
	tunnelStatusMap   cmap.ConcurrentMap
	endpointService   portainer.EndpointService
	snapshotter       portainer.Snapshotter
}

//TODO: document
func NewService(endpointService portainer.EndpointService) *Service {
	return &Service{
		tunnelStatusMap: cmap.New(),
		endpointService: endpointService,
	}
}

func (service *Service) SetupSnapshotter(snapshotter portainer.Snapshotter) {
	service.snapshotter = snapshotter
}

func (service *Service) StartTunnelServer(addr, port string) error {
	// TODO: keyseed management (persistence)
	// + auth management
	// Consider multiple users for auth?
	// This service could generate/persist credentials for each endpoints
	config := &chserver.Config{
		Reverse: true,
		KeySeed: "keyseedexample",
		Auth:    "agent@randomstring",
	}

	chiselServer, err := chserver.NewServer(config)
	if err != nil {
		return err
	}

	service.serverFingerprint = chiselServer.GetFingerprint()
	service.serverPort = port
	go service.tunnelCleanup()
	return chiselServer.Start(addr, port)
}

func (service *Service) GetServerFingerprint() string {
	return service.serverFingerprint
}

func (service *Service) GetServerPort() string {
	return service.serverPort
}

// TODO: rename/refactor/add/review logging
// Manage tunnels every minutes?
func (service *Service) tunnelCleanup() {
	ticker := time.NewTicker(tunnelCleanupInterval)
	quit := make(chan struct{})

	for {
		select {
		case <-ticker.C:
			for item := range service.tunnelStatusMap.IterBuffered() {
				tunnelStatus := item.Val.(TunnelStatus)
				if tunnelStatus.lastActivity.IsZero() || tunnelStatus.state != portainer.EdgeAgentActive {
					continue
				}

				elapsed := time.Since(tunnelStatus.lastActivity)
				if elapsed.Seconds() > time.Duration(inactivityTimerDuration).Seconds() {

					endpointID, err := strconv.Atoi(item.Key)
					if err != nil {
						log.Printf("[ERROR] [conversion] Unable to snapshot Edge endpoint (id: %s): %s", item.Key, err)
					}

					if err == nil {
						endpoint, err := service.endpointService.Endpoint(portainer.EndpointID(endpointID))
						if err != nil {
							log.Printf("[ERROR] [db] Unable to retrieve Edge endpoint information (id: %s): %s", item.Key, err)
						}

						endpointURL := endpoint.URL
						endpoint.URL = fmt.Sprintf("tcp://localhost:%d", tunnelStatus.port)
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
					//service.tunnelStatusMap.Remove(item.Key)

					tunnelStatus.state = portainer.EdgeAgentIdle
					tunnelStatus.port = 0
					log.Printf("[DEBUG] #1 TAG ENDPOINT TUNNEL AS: %s | %d", tunnelStatus.state, tunnelStatus.port)
					service.tunnelStatusMap.Set(item.Key, tunnelStatus)
				}
			}

		// do something
		case <-quit:
			ticker.Stop()
			return
		}
	}
	// TODO: required?
	// close(quit) to exit
}

// TODO: credentials management
func (service *Service) GetClientCredentials(endpointID portainer.EndpointID) string {
	return "agent:randomstring"
}

func (service *Service) getUnusedPort() int {
	port := randomInt(minAvailablePort, maxAvailablePort)

	for item := range service.tunnelStatusMap.IterBuffered() {
		value := item.Val.(TunnelStatus)
		if value.port == port {
			return service.getUnusedPort()
		}
	}

	return port
}

func (service *Service) GetTunnelState(endpointID portainer.EndpointID) (string, int, []portainer.EdgeSchedule) {
	key := strconv.Itoa(int(endpointID))

	if item, ok := service.tunnelStatusMap.Get(key); ok {
		tunnelStatus := item.(TunnelStatus)
		return tunnelStatus.state, tunnelStatus.port, tunnelStatus.schedules
	}

	schedules := make([]portainer.EdgeSchedule, 0)
	return portainer.EdgeAgentIdle, 0, schedules
}

func (service *Service) UpdateTunnelState(endpointID portainer.EndpointID, state string) {
	key := strconv.Itoa(int(endpointID))

	var tunnelStatus TunnelStatus
	item, ok := service.tunnelStatusMap.Get(key)
	if ok {
		tunnelStatus = item.(TunnelStatus)
		tunnelStatus.state = state
	} else {
		tunnelStatus = TunnelStatus{state: state, schedules: []portainer.EdgeSchedule{}}
	}

	if state == portainer.EdgeAgentManagementRequired && tunnelStatus.port == 0 {
		tunnelStatus.port = service.getUnusedPort()
	}

	log.Printf("[DEBUG] #2 TAG ENDPOINT TUNNEL AS: %s | %d", tunnelStatus.state, tunnelStatus.port)

	service.tunnelStatusMap.Set(key, tunnelStatus)
}

// TODO: remove debug

func (service *Service) ResetTunnelActivityTimer(endpointID portainer.EndpointID) {
	key := strconv.Itoa(int(endpointID))

	var tunnelStatus TunnelStatus
	item, ok := service.tunnelStatusMap.Get(key)
	if ok {
		tunnelStatus = item.(TunnelStatus)
		tunnelStatus.state = portainer.EdgeAgentActive
		tunnelStatus.lastActivity = time.Now()
		service.tunnelStatusMap.Set(key, tunnelStatus)
		log.Printf("[DEBUG] #3 TAG ENDPOINT TUNNEL AS: %s | %d", tunnelStatus.state, tunnelStatus.port)
	}
}

func (service *Service) AddSchedule(endpointID portainer.EndpointID, schedule *portainer.EdgeSchedule) {
	key := strconv.Itoa(int(endpointID))

	var tunnelStatus TunnelStatus
	item, ok := service.tunnelStatusMap.Get(key)
	if ok {
		tunnelStatus = item.(TunnelStatus)
		tunnelStatus.schedules = append(tunnelStatus.schedules, *schedule)
	} else {
		tunnelStatus = TunnelStatus{state: portainer.EdgeAgentIdle, schedules: []portainer.EdgeSchedule{*schedule}}
	}

	log.Printf("[DEBUG] #4 ADDING SCHEDULE %d | %s", schedule.ID, schedule.CronExpression)
	service.tunnelStatusMap.Set(key, tunnelStatus)
}

func (service *Service) RemoveSchedule(scheduleID portainer.ScheduleID) {
	for item := range service.tunnelStatusMap.IterBuffered() {
		tunnelStatus := item.Val.(TunnelStatus)

		updatedSchedules := make([]portainer.EdgeSchedule, 0)
		for _, schedule := range tunnelStatus.schedules {
			if schedule.ID == scheduleID {
				log.Printf("[DEBUG] #5 REMOVING SCHEDULE %d", scheduleID)
				continue
			}
			updatedSchedules = append(updatedSchedules, schedule)
		}

		tunnelStatus.schedules = updatedSchedules
		service.tunnelStatusMap.Set(item.Key, tunnelStatus)
	}
}

func randomInt(min, max int) int {
	// TODO: should be randomize at service creation time?
	// if not seeded, will always get same port order
	// might not be a problem and maybe not required
	//rand.Seed(time.Now().UnixNano())

	return min + rand.Intn(max-min)
}
