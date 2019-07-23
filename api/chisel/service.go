package chisel

import (
	"time"

	"github.com/dchest/uniuri"

	cmap "github.com/orcaman/concurrent-map"

	chserver "github.com/jpillora/chisel/server"
	portainer "github.com/portainer/portainer/api"
)

//TODO: document the whole package

// Dynamic ports (also called private ports) are 49152 to 65535.
const (
	minAvailablePort      = 49152
	maxAvailablePort      = 65535
	tunnelCleanupInterval = 10 * time.Second
	requiredTimeout       = 15 * time.Second
	activeTimeout         = 5 * time.Minute
)

type Service struct {
	serverFingerprint   string
	serverPort          string
	tunnelDetailsMap    cmap.ConcurrentMap
	endpointService     portainer.EndpointService
	tunnelServerService portainer.TunnelServerService
	snapshotter         portainer.Snapshotter
	chiselServer        *chserver.Server
}

func NewService(endpointService portainer.EndpointService, tunnelServerService portainer.TunnelServerService) *Service {
	return &Service{
		tunnelDetailsMap:    cmap.New(),
		endpointService:     endpointService,
		tunnelServerService: tunnelServerService,
	}
}

func (service *Service) SetupSnapshotter(snapshotter portainer.Snapshotter) {
	service.snapshotter = snapshotter
}

func (service *Service) StartTunnelServer(addr, port string) error {
	keySeed, err := service.retrievePrivateKeySeed()
	if err != nil {
		return err
	}

	config := &chserver.Config{
		Reverse: true,
		KeySeed: keySeed,
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

	// TODO: work-around Chisel default behavior.
	// By default, Chisel will allow anyone to connect if no user exists.
	username, password := generateRandomCredentials()
	err = service.chiselServer.AddUser(username, password, "127.0.0.1")
	if err != nil {
		return err
	}

	go service.tunnelCleanup()

	return nil
}

func (service *Service) retrievePrivateKeySeed() (string, error) {
	var serverInfo *portainer.TunnelServerInfo

	serverInfo, err := service.tunnelServerService.Info()
	if err == portainer.ErrObjectNotFound {
		keySeed := uniuri.NewLen(16)

		serverInfo = &portainer.TunnelServerInfo{
			PrivateKeySeed: keySeed,
		}

		err := service.tunnelServerService.UpdateInfo(serverInfo)
		if err != nil {
			return "", err
		}
	} else if err != nil {
		return "", err
	}

	return serverInfo.PrivateKeySeed, nil
}
