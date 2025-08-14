package pendingactions

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func TestExecute(t *testing.T) {
	tests := []struct {
		name           string
		endpoint       *portainer.Endpoint
		pendingActions []portainer.PendingAction
		shouldExecute  bool
	}{
		{
			name: "Edge endpoint with heartbeat should execute",
			// Create test endpoint
			endpoint: &portainer.Endpoint{
				ID:        1,
				Heartbeat: true,
				Type:      portainer.EdgeAgentOnDockerEnvironment,
				EdgeID:    "edge-1",
			},
			pendingActions: []portainer.PendingAction{
				{ID: 1, EndpointID: 1, Action: "test-action"},
			},
			shouldExecute: true,
		},
		{
			name: "Edge endpoint without heartbeat should not execute",
			endpoint: &portainer.Endpoint{
				ID:        2,
				EdgeID:    "edge-2",
				Heartbeat: false,
				Type:      portainer.EdgeAgentOnDockerEnvironment,
			},
			pendingActions: []portainer.PendingAction{
				{ID: 2, EndpointID: 2, Action: "test-action"},
			},
			shouldExecute: false,
		},
		{
			name: "Regular endpoint with status UP should execute",
			endpoint: &portainer.Endpoint{
				ID:     3,
				Status: portainer.EndpointStatusUp,
				Type:   portainer.AgentOnDockerEnvironment,
			},
			pendingActions: []portainer.PendingAction{
				{ID: 3, EndpointID: 3, Action: "test-action"},
			},
			shouldExecute: true,
		},
		{
			name: "Regular endpoint with status DOWN should not execute",
			endpoint: &portainer.Endpoint{
				ID:     4,
				Status: portainer.EndpointStatusDown,
				Type:   portainer.AgentOnDockerEnvironment,
			},
			pendingActions: []portainer.PendingAction{
				{ID: 4, EndpointID: 4, Action: "test-action"},
			},
			shouldExecute: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup services
			store := testhelpers.NewDatastore(testhelpers.WithEndpoints([]portainer.Endpoint{*tt.endpoint}), testhelpers.WithPendingActions(tt.pendingActions))
			service := NewService(store, nil)

			// Execute
			service.execute(tt.endpoint.ID)

			// Verify expectations
			pendingActions, _ := store.PendingActions().ReadAll()
			if tt.shouldExecute {
				assert.Equal(t, len(tt.pendingActions)-1, len(pendingActions))
			} else {
				assert.Equal(t, len(tt.pendingActions), len(pendingActions))
			}
		})
	}
}
