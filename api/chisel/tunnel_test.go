package chisel

import (
	"net"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type testSettingsService struct {
	dataservices.SettingsService
}

func (s *testSettingsService) Settings() (*portainer.Settings, error) {
	return &portainer.Settings{
		EdgeAgentCheckinInterval: 1,
	}, nil
}

type testStore struct {
	dataservices.DataStore
}

func (s *testStore) Settings() dataservices.SettingsService {
	return &testSettingsService{}
}

func TestGetUnusedPort(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		name            string
		existingTunnels map[portainer.EndpointID]*portainer.TunnelDetails
		expectedError   error
	}{
		{
			name: "simple case",
		},
		{
			name: "existing tunnels",
			existingTunnels: map[portainer.EndpointID]*portainer.TunnelDetails{
				portainer.EndpointID(1): {
					Port: 53072,
				},
				portainer.EndpointID(2): {
					Port: 63072,
				},
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			store := &testStore{}
			s := NewService(store, nil, nil)
			s.activeTunnels = tc.existingTunnels
			port := s.getUnusedPort()

			if port < 49152 || port > 65535 {
				t.Fatalf("Expected port to be inbetween 49152 and 65535 but got %d", port)
			}

			for _, tun := range tc.existingTunnels {
				if tun.Port == port {
					t.Fatalf("returned port %d already has an existing tunnel", port)
				}
			}

			conn, err := net.DialTCP("tcp", nil, &net.TCPAddr{IP: net.IPv4(127, 0, 0, 1), Port: port})
			if err == nil {
				// Ignore error
				_ = conn.Close()
				t.Fatalf("expected port %d to be unused", port)
			} else if !strings.Contains(err.Error(), "connection refused") {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}
