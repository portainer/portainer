package chisel

import (
	"encoding/base64"
	"fmt"
	"math/rand"
	"strconv"
	"strings"
	"time"

	"github.com/portainer/libcrypto"

	"github.com/dchest/uniuri"
	portainer "github.com/portainer/portainer/api"
)

const (
	minAvailablePort = 49152
	maxAvailablePort = 65535
)

// getUnusedPort is used to generate an unused random port in the dynamic port range.
// Dynamic ports (also called private ports) are 49152 to 65535.
func (service *Service) getUnusedPort() int {
	port := randomInt(minAvailablePort, maxAvailablePort)

	for item := range service.tunnelDetailsMap.IterBuffered() {
		tunnel := item.Val.(*portainer.TunnelDetails)
		if tunnel.Port == port {
			return service.getUnusedPort()
		}
	}

	return port
}

func randomInt(min, max int) int {
	return min + rand.Intn(max-min)
}

// GetTunnelDetails returns information about the tunnel associated to an environment(endpoint).
func (service *Service) GetTunnelDetails(endpointID portainer.EndpointID) *portainer.TunnelDetails {
	key := strconv.Itoa(int(endpointID))

	if item, ok := service.tunnelDetailsMap.Get(key); ok {
		tunnelDetails := item.(*portainer.TunnelDetails)
		return tunnelDetails
	}

	jobs := make([]portainer.EdgeJob, 0)
	return &portainer.TunnelDetails{
		Status:      portainer.EdgeAgentIdle,
		Port:        0,
		Jobs:        jobs,
		Credentials: "",
	}
}

// GetActiveTunnel retrieves an active tunnel which allows communicating with edge agent
func (service *Service) GetActiveTunnel(endpoint *portainer.Endpoint) (*portainer.TunnelDetails, error) {
	tunnel := service.GetTunnelDetails(endpoint.ID)
	if tunnel.Status == portainer.EdgeAgentIdle || tunnel.Status == portainer.EdgeAgentManagementRequired {
		err := service.SetTunnelStatusToRequired(endpoint.ID)
		if err != nil {
			return nil, fmt.Errorf("failed opening tunnel to endpoint: %w", err)
		}

		if endpoint.EdgeCheckinInterval == 0 {
			settings, err := service.dataStore.Settings().Settings()
			if err != nil {
				return nil, fmt.Errorf("failed fetching settings from db: %w", err)
			}

			endpoint.EdgeCheckinInterval = settings.EdgeAgentCheckinInterval
		}

		waitForAgentToConnect := time.Duration(endpoint.EdgeCheckinInterval) * time.Second
		time.Sleep(waitForAgentToConnect * 2)
	}
	tunnel = service.GetTunnelDetails(endpoint.ID)

	return tunnel, nil
}

// SetTunnelStatusToActive update the status of the tunnel associated to the specified environment(endpoint).
// It sets the status to ACTIVE.
func (service *Service) SetTunnelStatusToActive(endpointID portainer.EndpointID) {
	tunnel := service.GetTunnelDetails(endpointID)
	tunnel.Status = portainer.EdgeAgentActive
	tunnel.Credentials = ""
	tunnel.LastActivity = time.Now()

	key := strconv.Itoa(int(endpointID))
	service.tunnelDetailsMap.Set(key, tunnel)
}

// SetTunnelStatusToIdle update the status of the tunnel associated to the specified environment(endpoint).
// It sets the status to IDLE.
// It removes any existing credentials associated to the tunnel.
func (service *Service) SetTunnelStatusToIdle(endpointID portainer.EndpointID) {
	tunnel := service.GetTunnelDetails(endpointID)

	tunnel.Status = portainer.EdgeAgentIdle
	tunnel.Port = 0
	tunnel.LastActivity = time.Now()

	credentials := tunnel.Credentials
	if credentials != "" {
		tunnel.Credentials = ""
		service.chiselServer.DeleteUser(strings.Split(credentials, ":")[0])
	}

	key := strconv.Itoa(int(endpointID))
	service.tunnelDetailsMap.Set(key, tunnel)
}

// SetTunnelStatusToRequired update the status of the tunnel associated to the specified environment(endpoint).
// It sets the status to REQUIRED.
// If no port is currently associated to the tunnel, it will associate a random unused port to the tunnel
// and generate temporary credentials that can be used to establish a reverse tunnel on that port.
// Credentials are encrypted using the Edge ID associated to the environment(endpoint).
func (service *Service) SetTunnelStatusToRequired(endpointID portainer.EndpointID) error {
	tunnel := service.GetTunnelDetails(endpointID)

	if tunnel.Port == 0 {
		endpoint, err := service.dataStore.Endpoint().Endpoint(endpointID)
		if err != nil {
			return err
		}

		tunnel.Status = portainer.EdgeAgentManagementRequired
		tunnel.Port = service.getUnusedPort()
		tunnel.LastActivity = time.Now()

		username, password := generateRandomCredentials()
		authorizedRemote := fmt.Sprintf("^R:0.0.0.0:%d$", tunnel.Port)
		err = service.chiselServer.AddUser(username, password, authorizedRemote)
		if err != nil {
			return err
		}

		credentials, err := encryptCredentials(username, password, endpoint.EdgeID)
		if err != nil {
			return err
		}
		tunnel.Credentials = credentials

		key := strconv.Itoa(int(endpointID))
		service.tunnelDetailsMap.Set(key, tunnel)
	}

	return nil
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
