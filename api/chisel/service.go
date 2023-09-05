package chisel

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/proxy"

	chserver "github.com/jpillora/chisel/server"
	"github.com/jpillora/chisel/share/ccrypto"
	"github.com/rs/zerolog/log"
)

const (
	tunnelCleanupInterval = 10 * time.Second
	requiredTimeout       = 15 * time.Second
	activeTimeout         = 4*time.Minute + 30*time.Second
)

// Service represents a service to manage the state of multiple reverse tunnels.
// It is used to start a reverse tunnel server and to manage the connection status of each tunnel
// connected to the tunnel server.
type Service struct {
	serverFingerprint string
	serverPort        string
	tunnelDetailsMap  map[portainer.EndpointID]*portainer.TunnelDetails
	dataStore         dataservices.DataStore
	snapshotService   portainer.SnapshotService
	chiselServer      *chserver.Server
	shutdownCtx       context.Context
	ProxyManager      *proxy.Manager
	mu                sync.Mutex
	fileService       portainer.FileService
}

// NewService returns a pointer to a new instance of Service
func NewService(dataStore dataservices.DataStore, shutdownCtx context.Context, fileService portainer.FileService) *Service {
	return &Service{
		tunnelDetailsMap: make(map[portainer.EndpointID]*portainer.TunnelDetails),
		dataStore:        dataStore,
		shutdownCtx:      shutdownCtx,
		fileService:      fileService,
	}
}

// pingAgent ping the given agent so that the agent can keep the tunnel alive
func (service *Service) pingAgent(endpointID portainer.EndpointID) error {
	tunnel := service.GetTunnelDetails(endpointID)
	requestURL := fmt.Sprintf("http://127.0.0.1:%d/ping", tunnel.Port)
	req, err := http.NewRequest(http.MethodHead, requestURL, nil)
	if err != nil {
		return err
	}

	httpClient := &http.Client{
		Timeout: 3 * time.Second,
	}

	resp, err := httpClient.Do(req)
	io.Copy(io.Discard, resp.Body)
	resp.Body.Close()

	return err
}

// KeepTunnelAlive keeps the tunnel of the given environment for maxAlive duration, or until ctx is done
func (service *Service) KeepTunnelAlive(endpointID portainer.EndpointID, ctx context.Context, maxAlive time.Duration) {
	go func() {
		log.Debug().
			Int("endpoint_id", int(endpointID)).
			Float64("max_alive_minutes", maxAlive.Minutes()).
			Msg("KeepTunnelAlive: start")

		maxAliveTicker := time.NewTicker(maxAlive)
		defer maxAliveTicker.Stop()

		pingTicker := time.NewTicker(tunnelCleanupInterval)
		defer pingTicker.Stop()

		for {
			select {
			case <-pingTicker.C:
				service.SetTunnelStatusToActive(endpointID)
				err := service.pingAgent(endpointID)
				if err != nil {
					log.Debug().
						Int("endpoint_id", int(endpointID)).
						Err(err).
						Msg("KeepTunnelAlive: ping agent")
				}
			case <-maxAliveTicker.C:
				log.Debug().
					Int("endpoint_id", int(endpointID)).
					Float64("timeout_minutes", maxAlive.Minutes()).
					Msg("KeepTunnelAlive: tunnel keep alive timeout")

				return
			case <-ctx.Done():
				err := ctx.Err()
				log.Debug().
					Int("endpoint_id", int(endpointID)).
					Err(err).
					Msg("KeepTunnelAlive: tunnel stop")

				return
			}
		}
	}()
}

// StartTunnelServer starts a tunnel server on the specified addr and port.
// It uses a seed to generate a new private/public key pair. If the seed cannot
// be found inside the database, it will generate a new one randomly and persist it.
// It starts the tunnel status verification process in the background.
// The snapshotter is used in the tunnel status verification process.
func (service *Service) StartTunnelServer(addr, port string, snapshotService portainer.SnapshotService) error {
	privateKeyFile, err := service.retrievePrivateKeyFile()

	if err != nil {
		return err
	}

	config := &chserver.Config{
		Reverse:        true,
		PrivateKeyFile: privateKeyFile,
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

	service.snapshotService = snapshotService
	go service.startTunnelVerificationLoop()

	return nil
}

// StopTunnelServer stops tunnel http server
func (service *Service) StopTunnelServer() error {
	return service.chiselServer.Close()
}

func (service *Service) retrievePrivateKeyFile() (string, error) {
	privateKeyFile := service.fileService.GetDefaultChiselPrivateKeyPath()

	exist, _ := service.fileService.FileExists(privateKeyFile)
	if !exist {
		log.Debug().
			Str("private-key", privateKeyFile).
			Msg("Chisel private key file does not exist")

		privateKey, err := ccrypto.GenerateKey("")
		if err != nil {
			log.Error().
				Err(err).
				Msg("Failed to generate chisel private key")
			return "", err
		}

		err = service.fileService.StoreChiselPrivateKey(privateKey)
		if err != nil {
			log.Error().
				Err(err).
				Msg("Failed to save Chisel private key to disk")
			return "", err
		} else {
			log.Info().
				Str("private-key", privateKeyFile).
				Msg("Generated a new Chisel private key file")
		}
	} else {
		log.Info().
			Str("private-key", privateKeyFile).
			Msg("Found Chisel private key file on disk")
	}

	return privateKeyFile, nil
}

func (service *Service) startTunnelVerificationLoop() {
	log.Debug().
		Float64("check_interval_seconds", tunnelCleanupInterval.Seconds()).
		Msg("starting tunnel management process")

	ticker := time.NewTicker(tunnelCleanupInterval)

	for {
		select {
		case <-ticker.C:
			service.checkTunnels()
		case <-service.shutdownCtx.Done():
			log.Debug().Msg("shutting down tunnel service")

			if err := service.StopTunnelServer(); err != nil {
				log.Debug().Err(err).Msg("stopped tunnel service")
			}

			ticker.Stop()
			return
		}
	}
}

func (service *Service) checkTunnels() {
	tunnels := make(map[portainer.EndpointID]portainer.TunnelDetails)

	service.mu.Lock()
	for key, tunnel := range service.tunnelDetailsMap {
		if tunnel.LastActivity.IsZero() || tunnel.Status == portainer.EdgeAgentIdle {
			continue
		}

		if tunnel.Status == portainer.EdgeAgentManagementRequired && time.Since(tunnel.LastActivity) < requiredTimeout {
			continue
		}

		if tunnel.Status == portainer.EdgeAgentActive && time.Since(tunnel.LastActivity) < activeTimeout {
			continue
		}

		tunnels[key] = *tunnel
	}
	service.mu.Unlock()

	for endpointID, tunnel := range tunnels {
		elapsed := time.Since(tunnel.LastActivity)
		log.Debug().
			Int("endpoint_id", int(endpointID)).
			Str("status", tunnel.Status).
			Float64("status_time_seconds", elapsed.Seconds()).
			Msg("environment tunnel monitoring")

		if tunnel.Status == portainer.EdgeAgentManagementRequired && elapsed > requiredTimeout {
			log.Debug().
				Int("endpoint_id", int(endpointID)).
				Str("status", tunnel.Status).
				Float64("status_time_seconds", elapsed.Seconds()).
				Float64("timeout_seconds", requiredTimeout.Seconds()).
				Msg("REQUIRED state timeout exceeded")
		}

		if tunnel.Status == portainer.EdgeAgentActive && elapsed > activeTimeout {
			log.Debug().
				Int("endpoint_id", int(endpointID)).
				Str("status", tunnel.Status).
				Float64("status_time_seconds", elapsed.Seconds()).
				Float64("timeout_seconds", activeTimeout.Seconds()).
				Msg("ACTIVE state timeout exceeded")

			err := service.snapshotEnvironment(endpointID, tunnel.Port)
			if err != nil {
				log.Error().
					Int("endpoint_id", int(endpointID)).
					Err(err).
					Msg("unable to snapshot Edge environment")
			}
		}

		service.SetTunnelStatusToIdle(portainer.EndpointID(endpointID))
	}
}

func (service *Service) snapshotEnvironment(endpointID portainer.EndpointID, tunnelPort int) error {
	endpoint, err := service.dataStore.Endpoint().Endpoint(endpointID)
	if err != nil {
		return err
	}

	endpoint.URL = fmt.Sprintf("tcp://127.0.0.1:%d", tunnelPort)

	return service.snapshotService.SnapshotEndpoint(endpoint)
}
