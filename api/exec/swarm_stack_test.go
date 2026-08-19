package exec

import (
	"context"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/libstack"
	"github.com/portainer/portainer/pkg/libstack/swarm"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type stubSwarmDeployer struct {
	swarm.Deployer

	waitResult libstack.WaitResult
}

func (s *stubSwarmDeployer) WaitForStatus(context.Context, string, swarm.Options, libstack.Status) libstack.WaitResult {
	return s.waitResult
}

func TestSwarmStackManager_CheckRunningStatus(t *testing.T) {
	t.Parallel()

	stack := &portainer.Stack{Name: "my-stack"}
	// unix:// URLs skip fetchEndpointProxy's proxy-manager path entirely, so a nil proxyManager is safe here.
	endpoint := &portainer.Endpoint{URL: "unix:///var/run/docker.sock"}

	tests := []struct {
		name            string
		waitResult      libstack.WaitResult
		expectedRunning bool
	}{
		{
			name:            "reports running once Running is confirmed",
			waitResult:      libstack.WaitResult{Status: libstack.StatusRunning},
			expectedRunning: true,
		},
		{
			name:            "reports not running when an explicit failure is observed",
			waitResult:      libstack.WaitResult{Status: libstack.StatusError, ErrorMsg: "no such image"},
			expectedRunning: false,
		},
		{
			name:            "reports not running when the probe times out without confirming",
			waitResult:      libstack.WaitResult{Status: libstack.StatusRunning, ErrorMsg: "failed to wait for status: context deadline exceeded"},
			expectedRunning: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			deployer := &stubSwarmDeployer{waitResult: tt.waitResult}
			manager := NewSwarmStackManager(deployer, nil)

			running, err := manager.CheckRunningStatus(t.Context(), stack, endpoint)
			require.NoError(t, err)
			assert.Equal(t, tt.expectedRunning, running)
		})
	}
}
