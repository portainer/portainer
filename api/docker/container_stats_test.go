package docker

import (
	"testing"

	"github.com/docker/docker/api/types"
	"github.com/stretchr/testify/assert"
)

func TestCalculateContainerStats(t *testing.T) {
	containers := []types.Container{
		{State: "running"},
		{State: "running"},
		{State: "exited"},
		{State: "stopped"},
		{State: "healthy"},
		{State: "unhealthy"},
	}

	stats := CalculateContainerStats(containers)

	assert.Equal(t, 4, stats.Running)
	assert.Equal(t, 2, stats.Stopped)
	assert.Equal(t, 1, stats.Healthy)
	assert.Equal(t, 1, stats.Unhealthy)
	assert.Equal(t, 6, stats.Total)
}
