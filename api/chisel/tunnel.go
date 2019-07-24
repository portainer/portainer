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

func (service *Service) GetTunnelDetails(endpointID portainer.EndpointID) *portainer.TunnelDetails {
	key := strconv.Itoa(int(endpointID))

	if item, ok := service.tunnelDetailsMap.Get(key); ok {
		tunnelDetails := item.(*portainer.TunnelDetails)
		return tunnelDetails
	}

	schedules := make([]portainer.EdgeSchedule, 0)
	return &portainer.TunnelDetails{
		Status:      portainer.EdgeAgentIdle,
		Port:        0,
		Schedules:   schedules,
		Credentials: "",
	}
}

func (service *Service) SetActiveTunnel(endpointID portainer.EndpointID) {
	tunnel := service.GetTunnelDetails(endpointID)
	tunnel.Status = portainer.EdgeAgentActive
	tunnel.Credentials = ""
	tunnel.LastActivity = time.Now()

	key := strconv.Itoa(int(endpointID))
	service.tunnelDetailsMap.Set(key, tunnel)
}

func (service *Service) SetIdleTunnel(endpointID portainer.EndpointID) {
	tunnel := service.GetTunnelDetails(endpointID)

	tunnel.Status = portainer.EdgeAgentIdle
	tunnel.Port = 0
	tunnel.LastActivity = time.Now()

	credentials := tunnel.Credentials
	tunnel.Credentials = ""
	service.chiselServer.DeleteUser(strings.Split(credentials, ":")[0])

	key := strconv.Itoa(int(endpointID))
	service.tunnelDetailsMap.Set(key, tunnel)
}

func (service *Service) SetRequiredTunnel(endpointID portainer.EndpointID) error {
	tunnel := service.GetTunnelDetails(endpointID)

	if tunnel.Port == 0 {
		endpoint, err := service.endpointService.Endpoint(endpointID)
		if err != nil {
			return err
		}

		if endpoint.Type != portainer.EdgeAgentEnvironment {
			return nil
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
