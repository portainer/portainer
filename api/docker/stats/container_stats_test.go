package stats

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockDockerClient implements the DockerClient interface for testing
type MockDockerClient struct {
	mock.Mock
}

func (m *MockDockerClient) ContainerInspect(ctx context.Context, containerID string) (container.InspectResponse, error) {
	args := m.Called(ctx, containerID)
	return args.Get(0).(container.InspectResponse), args.Error(1)
}

func TestCalculateContainerStats(t *testing.T) {
	mockClient := new(MockDockerClient)

	// Test containers - using enough containers to test concurrent processing
	containers := []container.Summary{
		{ID: "container1"},
		{ID: "container2"},
		{ID: "container3"},
		{ID: "container4"},
		{ID: "container5"},
		{ID: "container6"},
		{ID: "container7"},
		{ID: "container8"},
		{ID: "container9"},
		{ID: "container10"},
	}

	// Setup mock expectations with different container states to test various scenarios
	containerStates := []struct {
		id       string
		status   string
		health   *container.Health
		expected ContainerStats
	}{
		{"container1", container.StateRunning, &container.Health{Status: container.Healthy}, ContainerStats{Running: 1, Stopped: 0, Healthy: 1, Unhealthy: 0}},
		{"container2", container.StateRunning, &container.Health{Status: container.Unhealthy}, ContainerStats{Running: 1, Stopped: 0, Healthy: 0, Unhealthy: 1}},
		{"container3", container.StateRunning, nil, ContainerStats{Running: 1, Stopped: 0, Healthy: 0, Unhealthy: 0}},
		{"container4", container.StateExited, nil, ContainerStats{Running: 0, Stopped: 1, Healthy: 0, Unhealthy: 0}},
		{"container5", container.StateDead, nil, ContainerStats{Running: 0, Stopped: 1, Healthy: 0, Unhealthy: 0}},
		{"container6", container.StateRunning, &container.Health{Status: container.Healthy}, ContainerStats{Running: 1, Stopped: 0, Healthy: 1, Unhealthy: 0}},
		{"container7", container.StateRunning, &container.Health{Status: container.Unhealthy}, ContainerStats{Running: 1, Stopped: 0, Healthy: 0, Unhealthy: 1}},
		{"container8", container.StateExited, nil, ContainerStats{Running: 0, Stopped: 1, Healthy: 0, Unhealthy: 0}},
		{"container9", container.StateRunning, nil, ContainerStats{Running: 1, Stopped: 0, Healthy: 0, Unhealthy: 0}},
		{"container10", container.StateDead, nil, ContainerStats{Running: 0, Stopped: 1, Healthy: 0, Unhealthy: 0}},
	}

	expected := ContainerStats{}
	// Setup mock expectations for all containers with artificial delays to simulate real Docker calls
	for _, state := range containerStates {
		mockClient.On("ContainerInspect", mock.Anything, state.id).Return(container.InspectResponse{
			ContainerJSONBase: &container.ContainerJSONBase{
				State: &container.State{
					Status: state.status,
					Health: state.health,
				},
			},
		}, nil).After(50 * time.Millisecond) // Simulate 50ms Docker API call

		expected.Running += state.expected.Running
		expected.Stopped += state.expected.Stopped
		expected.Healthy += state.expected.Healthy
		expected.Unhealthy += state.expected.Unhealthy
		expected.Total++
	}

	// Call the function and measure time
	startTime := time.Now()
	stats, err := CalculateContainerStats(context.Background(), mockClient, false, containers)
	require.NoError(t, err, "failed to calculate container stats")
	duration := time.Since(startTime)

	// Assert results
	assert.Equal(t, expected, stats)
	assert.Equal(t, expected.Running, stats.Running)
	assert.Equal(t, expected.Stopped, stats.Stopped)
	assert.Equal(t, expected.Healthy, stats.Healthy)
	assert.Equal(t, expected.Unhealthy, stats.Unhealthy)
	assert.Equal(t, 10, stats.Total)

	// Verify concurrent processing by checking that all mock calls were made
	mockClient.AssertExpectations(t)

	// Test concurrency: With 5 workers and 10 containers taking 50ms each:
	// Sequential would take: 10 * 50ms = 500ms
	sequentialTime := 10 * 50 * time.Millisecond

	// Verify that concurrent processing is actually faster than sequential
	// Allow some overhead for goroutine scheduling
	assert.Less(t, duration, sequentialTime, "Concurrent processing should be faster than sequential")
	// Concurrent should take: ~100-150ms (depending on scheduling)
	assert.Less(t, duration, 150*time.Millisecond, "Concurrent processing should be significantly faster")
	assert.Greater(t, duration, 100*time.Millisecond, "Concurrent processing should be longer than 100ms")
}

func TestCalculateContainerStatsAllErrors(t *testing.T) {
	mockClient := new(MockDockerClient)

	// Test containers
	containers := []container.Summary{
		{ID: "container1"},
		{ID: "container2"},
	}

	// Setup mock expectations with all calls returning errors
	mockClient.On("ContainerInspect", mock.Anything, "container1").Return(container.InspectResponse{}, errors.New("network error"))
	mockClient.On("ContainerInspect", mock.Anything, "container2").Return(container.InspectResponse{}, errors.New("permission denied"))

	// Call the function
	stats, err := CalculateContainerStats(context.Background(), mockClient, false, containers)

	// Assert that an error was returned
	require.Error(t, err, "should return error when all containers fail to inspect")
	assert.Contains(t, err.Error(), "network error", "error should contain one of the original error messages")
	assert.Contains(t, err.Error(), "permission denied", "error should contain the other original error message")

	// Assert that stats are zero since no containers were successfully processed
	expectedStats := ContainerStats{
		Running:   0,
		Stopped:   0,
		Healthy:   0,
		Unhealthy: 0,
		Total:     2, // total containers processed
	}
	assert.Equal(t, expectedStats, stats)

	// Verify all mock calls were made
	mockClient.AssertExpectations(t)
}

func TestGetContainerStatus(t *testing.T) {
	testCases := []struct {
		name     string
		state    *container.State
		expected ContainerStats
	}{
		{
			name: "running healthy container",
			state: &container.State{
				Status: container.StateRunning,
				Health: &container.Health{
					Status: container.Healthy,
				},
			},
			expected: ContainerStats{
				Running:   1,
				Stopped:   0,
				Healthy:   1,
				Unhealthy: 0,
			},
		},
		{
			name: "running unhealthy container",
			state: &container.State{
				Status: container.StateRunning,
				Health: &container.Health{
					Status: container.Unhealthy,
				},
			},
			expected: ContainerStats{
				Running:   1,
				Stopped:   0,
				Healthy:   0,
				Unhealthy: 1,
			},
		},
		{
			name: "running container without health check",
			state: &container.State{
				Status: container.StateRunning,
			},
			expected: ContainerStats{
				Running:   1,
				Stopped:   0,
				Healthy:   0,
				Unhealthy: 0,
			},
		},
		{
			name: "exited container",
			state: &container.State{
				Status: container.StateExited,
			},
			expected: ContainerStats{
				Running:   0,
				Stopped:   1,
				Healthy:   0,
				Unhealthy: 0,
			},
		},
		{
			name: "dead container",
			state: &container.State{
				Status: container.StateDead,
			},
			expected: ContainerStats{
				Running:   0,
				Stopped:   1,
				Healthy:   0,
				Unhealthy: 0,
			},
		},
		{
			name:  "nil state",
			state: nil,
			expected: ContainerStats{
				Running:   0,
				Stopped:   0,
				Healthy:   0,
				Unhealthy: 0,
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			stat := getContainerStatus(testCase.state)
			assert.Equal(t, testCase.expected, stat)
		})
	}
}

func TestCalculateContainerStatsForSwarm(t *testing.T) {
	containers := []container.Summary{
		{State: "running"},
		{State: "running", Status: "Up 5 minutes (healthy)"},
		{State: "exited"},
		{State: "stopped"},
		{State: "running", Status: "Up 10 minutes"},
		{State: "running", Status: "Up about an hour (unhealthy)"},
	}

	stats := CalculateContainerStatsForSwarm(containers)

	assert.Equal(t, 4, stats.Running)
	assert.Equal(t, 2, stats.Stopped)
	assert.Equal(t, 1, stats.Healthy)
	assert.Equal(t, 1, stats.Unhealthy)
	assert.Equal(t, 6, stats.Total)
}
