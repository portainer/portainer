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
	activeTimeout         = 4*time.Minute + 30*time.Second
	pingTimeout           = 3 * time.Second
)

// Service represents a service to manage the state of multiple reverse tunnels.
// It is used to start a reverse tunnel server and to manage the connection status of each tunnel
// connected to the tunnel server.
type Service struct {
	serverFingerprint      string
	serverPort             string
	activeTunnels          map[portainer.EndpointID]*portainer.TunnelDetails
	edgeJobs               map[portainer.EndpointID][]portainer.EdgeJob
	dataStore              dataservices.DataStore
	snapshotService        portainer.SnapshotService
	chiselServer           *chserver.Server
	shutdownCtx            context.Context
	ProxyManager           *proxy.Manager
	mu                     sync.RWMutex
	fileService            portainer.FileService
	defaultCheckinInterval int
}

// NewService returns a pointer to a new instance of Service
func NewService(dataStore dataservices.DataStore, shutdownCtx context.Context, fileService portainer.FileService) *Service {
	defaultCheckinInterval := portainer.DefaultEdgeAgentCheckinIntervalInSeconds

	settings, err := dataStore.Settings().Settings()
	if err == nil {
		defaultCheckinInterval = settings.EdgeAgentCheckinInterval
	} else {
		log.Error().Err(err).Msg("unable to retrieve the settings from the database")
	}

	return &Service{
		activeTunnels:          make(map[portainer.EndpointID]*portainer.TunnelDetails),
		edgeJobs:               make(map[portainer.EndpointID][]portainer.EdgeJob),
		dataStore:              dataStore,
		shutdownCtx:            shutdownCtx,
		fileService:            fileService,
		defaultCheckinInterval: defaultCheckinInterval,
	}
}

// pingAgent ping the given agent so that the agent can keep the tunnel alive
func (service *Service) pingAgent(endpointID portainer.EndpointID) error {
	endpoint, err := service.dataStore.Endpoint().Endpoint(endpointID)
	if err != nil {
		return err
	}

	tunnelAddr, err := service.TunnelAddr(endpoint)
	if err != nil {
		return err
	}

	requestURL := fmt.Sprintf("http://%s/ping", tunnelAddr)
	req, err := http.NewRequest(http.MethodHead, requestURL, nil)
	if err != nil {
		return err
	}

	httpClient := &http.Client{
		Timeout: pingTimeout,
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}

	io.Copy(io.Discard, resp.Body)
	resp.Body.Close()

	return nil
}

// KeepTunnelAlive keeps the tunnel of the given environment for maxAlive duration, or until ctx is done
func (service *Service) KeepTunnelAlive(endpointID portainer.EndpointID, ctx context.Context, maxAlive time.Duration) {
	go service.keepTunnelAlive(endpointID, ctx, maxAlive)
}

func (service *Service) keepTunnelAlive(endpointID portainer.EndpointID, ctx context.Context, maxAlive time.Duration) {
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
			service.UpdateLastActivity(endpointID)

			if err := service.pingAgent(endpointID); err != nil {
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
		Reverse: true,
		KeyFile: privateKeyFile,
	}

	chiselServer, err := chserver.NewServer(config)
	if err != nil {
		return err
	}

	service.serverFingerprint = chiselServer.GetFingerprint()
	service.serverPort = port

	if err := chiselServer.Start(addr, port); err != nil {
		return err
	}

	service.chiselServer = chiselServer

	// TODO: work-around Chisel default behavior.
	// By default, Chisel will allow anyone to connect if no user exists.
	username, password := generateRandomCredentials()
	if err = service.chiselServer.AddUser(username, password, "127.0.0.1"); err != nil {
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

	if exists, _ := service.fileService.FileExists(privateKeyFile); exists {
		log.Info().
			Str("private-key", privateKeyFile).
			Msg("found Chisel private key file on disk")

		return privateKeyFile, nil
	}

	log.Debug().
		Str("private-key", privateKeyFile).
		Msg("chisel private key file does not exist")

	privateKey, err := ccrypto.GenerateKey("")
	if err != nil {
		log.Error().
			Err(err).
			Msg("failed to generate chisel private key")

		return "", err
	}

	if err = service.fileService.StoreChiselPrivateKey(privateKey); err != nil {
		log.Error().
			Err(err).
			Msg("failed to save Chisel private key to disk")

		return "", err
	}

	log.Info().
		Str("private-key", privateKeyFile).
		Msg("generated a new Chisel private key file")

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

// checkTunnels finds the first tunnel that has not had any activity recently
// and attempts to take a snapshot, then closes it and returns
func (service *Service) checkTunnels() {
	service.mu.RLock()

	for endpointID, tunnel := range service.activeTunnels {
		elapsed := time.Since(tunnel.LastActivity)
		log.Debug().
			Int("endpoint_id", int(endpointID)).
			Float64("last_activity_seconds", elapsed.Seconds()).
			Msg("environment tunnel monitoring")

		if tunnel.Status == portainer.EdgeAgentManagementRequired && elapsed < activeTimeout {
			continue
		}

		tunnelPort := tunnel.Port

		service.mu.RUnlock()

		log.Debug().
			Int("endpoint_id", int(endpointID)).
			Float64("last_activity_seconds", elapsed.Seconds()).
			Float64("timeout_seconds", activeTimeout.Seconds()).
			Msg("last activity timeout exceeded")

		if err := service.snapshotEnvironment(endpointID, tunnelPort); err != nil {
			log.Error().
				Int("endpoint_id", int(endpointID)).
				Err(err).
				Msg("unable to snapshot Edge environment")
		}

		service.close(endpointID)

		return
	}

	service.mu.RUnlock()
}

func (service *Service) snapshotEnvironment(endpointID portainer.EndpointID, tunnelPort int) error {
	endpoint, err := service.dataStore.Endpoint().Endpoint(endpointID)
	if err != nil {
		return err
	}

	endpoint.URL = fmt.Sprintf("tcp://127.0.0.1:%d", tunnelPort)

	return service.snapshotService.SnapshotEndpoint(endpoint)
}
