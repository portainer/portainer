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
	inactivityTimerDuration = 1 * time.Minute
	tunnelCleanupInterval   = 10 * time.Second
)

type TunnelStatus struct {
	state        string
	port         int
	lastActivity time.Time
}

type Service struct {
	serverFingerprint string
	serverPort        string
	tunnelStatusMap   cmap.ConcurrentMap
	endpointService   portainer.EndpointService
	snapshotter       portainer.Snapshotter
	//allocatedPorts    cmap.ConcurrentMap
	// endpoint | status | port
	// ID1: IDLE
	// ID2 (NOTFOUND) = IDLE
	// ID3: REQUIRED, PORT: xxxx
	// ID4: ACTIVE, PORT: xxxx
}

func NewService(endpointService portainer.EndpointService, snapshotter portainer.Snapshotter) *Service {
	return &Service{
		tunnelStatusMap: cmap.New(),
		endpointService: endpointService,
		snapshotter:     snapshotter,
		//allocatedPorts: cmap.New(),
	}
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

func (service *Service) GetTunnelState(endpointID portainer.EndpointID) (string, int) {
	key := strconv.Itoa(int(endpointID))

	if item, ok := service.tunnelStatusMap.Get(key); ok {
		tunnelStatus := item.(TunnelStatus)
		return tunnelStatus.state, tunnelStatus.port
	}

	return portainer.EdgeAgentIdle, 0
}

func (service *Service) UpdateTunnelState(endpointID portainer.EndpointID, state string) {
	key := strconv.Itoa(int(endpointID))

	var tunnelStatus TunnelStatus
	item, ok := service.tunnelStatusMap.Get(key)
	if ok {
		tunnelStatus = item.(TunnelStatus)
		tunnelStatus.state = state
	} else {
		tunnelStatus = TunnelStatus{state: state}
	}

	if state == portainer.EdgeAgentManagementRequired && tunnelStatus.port == 0 {
		tunnelStatus.port = service.getUnusedPort()
	}

	log.Printf("[DEBUG] #2 TAG ENDPOINT TUNNEL AS: %s | %d", tunnelStatus.state, tunnelStatus.port)

	service.tunnelStatusMap.Set(key, tunnelStatus)
}

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

func randomInt(min, max int) int {
	// TODO: should be randomize at service creation time?
	// if not seeded, will always get same port order
	// might not be a problem and maybe not required
	//rand.Seed(time.Now().UnixNano())

	return min + rand.Intn(max-min)
}
