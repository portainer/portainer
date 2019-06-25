package chisel

import (
	"math/rand"
	"strconv"

	cmap "github.com/orcaman/concurrent-map"

	chserver "github.com/jpillora/chisel/server"
	portainer "github.com/portainer/portainer/api"
)

// Dynamic ports (also called private ports) are 49152 to 65535.
const (
	minAvailablePort = 49152
	maxAvailablePort = 65535
)

type TunnelStatus struct {
	state string
	port  int
}

type Service struct {
	serverFingerprint string
	serverPort        string
	tunnelStatusMap   cmap.ConcurrentMap
	//allocatedPorts    cmap.ConcurrentMap
	// endpoint | status | port
	// ID1: IDLE
	// ID2 (NOTFOUND) = IDLE
	// ID3: REQUIRED, PORT: xxxx
	// ID4: ACTIVE
}

func NewService() *Service {
	return &Service{
		tunnelStatusMap: cmap.New(),
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
	return chiselServer.Start(addr, port)
}

func (service *Service) GetServerFingerprint() string {
	return service.serverFingerprint
}

func (service *Service) GetServerPort() string {
	return service.serverPort
}

//func (service *Service) GetClientPort(endpointID portainer.EndpointID) int {
//	key := strconv.Itoa(int(endpointID))
//	if port, ok := service.allocatedPorts.Get(key); ok {
//		return port.(int)
//	}
//
//	port := service.getUnusedPort(endpointID)
//	service.allocatedPorts.Set(key, port)
//	return port
//}

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

	if state == portainer.EdgeAgentManagementRequired {
		tunnelStatus.port = service.getUnusedPort()
	}

	service.tunnelStatusMap.Set(key, tunnelStatus)
}

func randomInt(min, max int) int {
	// should be randomize at service creation time?
	// if not seeded, will always get same port order
	// might not be a problem and maybe not required
	//rand.Seed(time.Now().UnixNano())

	return min + rand.Intn(max-min)
}
