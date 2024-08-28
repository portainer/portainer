package chisel

import (
	"encoding/base64"
	"errors"
	"fmt"
	"math/rand"
	"net"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/edge/cache"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/pkg/libcrypto"

	"github.com/dchest/uniuri"
	"github.com/rs/zerolog/log"
)

const (
	minAvailablePort = 49152
	maxAvailablePort = 65535
)

var (
	ErrNonEdgeEnv = errors.New("cannot open a tunnel for non-edge environments")
	ErrAsyncEnv   = errors.New("cannot open a tunnel for async edge environments")
	ErrInvalidEnv = errors.New("cannot open a tunnel for an invalid environment")
)

// Open will mark the tunnel as REQUIRED so the agent opens it
func (s *Service) Open(endpoint *portainer.Endpoint) error {
	if !endpointutils.IsEdgeEndpoint(endpoint) {
		return ErrNonEdgeEnv
	}

	if endpoint.Edge.AsyncMode {
		return ErrAsyncEnv
	}

	if endpoint.ID == 0 || endpoint.EdgeID == "" || !endpoint.UserTrusted {
		return ErrInvalidEnv
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.activeTunnels[endpoint.ID]; ok {
		return nil
	}

	defer cache.Del(endpoint.ID)

	tun := &portainer.TunnelDetails{
		Status:       portainer.EdgeAgentManagementRequired,
		Port:         s.getUnusedPort(),
		LastActivity: time.Now(),
	}

	username, password := generateRandomCredentials()

	if s.chiselServer != nil {
		authorizedRemote := fmt.Sprintf("^R:0.0.0.0:%d$", tun.Port)

		if err := s.chiselServer.AddUser(username, password, authorizedRemote); err != nil {
			return err
		}
	}

	credentials, err := encryptCredentials(username, password, endpoint.EdgeID)
	if err != nil {
		return err
	}

	tun.Credentials = credentials

	s.activeTunnels[endpoint.ID] = tun

	return nil
}

// close removes the tunnel from the map so the agent will close it
func (s *Service) close(endpointID portainer.EndpointID) {
	s.mu.Lock()
	defer s.mu.Unlock()

	tun, ok := s.activeTunnels[endpointID]
	if !ok {
		return
	}

	if len(tun.Credentials) > 0 && s.chiselServer != nil {
		user, _, _ := strings.Cut(tun.Credentials, ":")
		s.chiselServer.DeleteUser(user)
	}

	if s.ProxyManager != nil {
		s.ProxyManager.DeleteEndpointProxy(endpointID)
	}

	delete(s.activeTunnels, endpointID)

	cache.Del(endpointID)
}

// Config returns the tunnel details needed for the agent to connect
func (s *Service) Config(endpointID portainer.EndpointID) portainer.TunnelDetails {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if tun, ok := s.activeTunnels[endpointID]; ok {
		return *tun
	}

	return portainer.TunnelDetails{Status: portainer.EdgeAgentIdle}
}

// TunnelAddr returns the address of the local tunnel, including the port, it
// will block until the tunnel is ready
func (s *Service) TunnelAddr(endpoint *portainer.Endpoint) (string, error) {
	if err := s.Open(endpoint); err != nil {
		return "", err
	}

	tun := s.Config(endpoint.ID)
	checkinInterval := time.Duration(s.tryEffectiveCheckinInterval(endpoint)) * time.Second

	for t0 := time.Now(); ; {
		if time.Since(t0) > 2*checkinInterval {
			s.close(endpoint.ID)

			return "", errors.New("unable to open the tunnel")
		}

		// Check if the tunnel is established
		conn, err := net.DialTCP("tcp", nil, &net.TCPAddr{IP: net.IPv4(127, 0, 0, 1), Port: tun.Port})
		if err != nil {
			time.Sleep(checkinInterval / 100)

			continue
		}

		conn.Close()

		break
	}

	s.UpdateLastActivity(endpoint.ID)

	return fmt.Sprintf("127.0.0.1:%d", tun.Port), nil
}

// tryEffectiveCheckinInterval avoids a potential deadlock by returning a
// previous known value after a timeout
func (s *Service) tryEffectiveCheckinInterval(endpoint *portainer.Endpoint) int {
	ch := make(chan int, 1)

	go func() {
		ch <- edge.EffectiveCheckinInterval(s.dataStore, endpoint)
	}()

	select {
	case <-time.After(50 * time.Millisecond):
		s.mu.RLock()
		defer s.mu.RUnlock()

		return s.defaultCheckinInterval
	case i := <-ch:
		s.mu.Lock()
		s.defaultCheckinInterval = i
		s.mu.Unlock()

		return i
	}
}

// UpdateLastActivity sets the current timestamp to avoid the tunnel timeout
func (s *Service) UpdateLastActivity(endpointID portainer.EndpointID) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if tun, ok := s.activeTunnels[endpointID]; ok {
		tun.LastActivity = time.Now()
	}
}

// NOTE: it needs to be called with the lock acquired
// getUnusedPort is used to generate an unused random port in the dynamic port range.
// Dynamic ports (also called private ports) are 49152 to 65535.
func (service *Service) getUnusedPort() int {
	port := randomInt(minAvailablePort, maxAvailablePort)

	for _, tunnel := range service.activeTunnels {
		if tunnel.Port == port {
			return service.getUnusedPort()
		}
	}

	conn, err := net.DialTCP("tcp", nil, &net.TCPAddr{IP: net.IPv4(127, 0, 0, 1), Port: port})
	if err == nil {
		conn.Close()

		log.Debug().
			Int("port", port).
			Msg("selected port is in use, trying a different one")

		return service.getUnusedPort()
	}

	return port
}

func randomInt(min, max int) int {
	return min + rand.Intn(max-min)
}

func generateRandomCredentials() (string, string) {
	username := uniuri.NewLen(8)
	password := uniuri.NewLen(8)

	return username, password
}

func encryptCredentials(username, password, key string) (string, error) {
	credentials := fmt.Sprintf("%s:%s", username, password)

	encryptedCredentials, err := libcrypto.Encrypt([]byte(credentials), []byte(key))
	if err != nil {
		return "", err
	}

	return base64.RawStdEncoding.EncodeToString(encryptedCredentials), nil
}
