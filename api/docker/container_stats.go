package docker

import (
	"strings"

	"github.com/docker/docker/api/types"
	"github.com/rs/zerolog/log"
)

type ContainerStats struct {
	Running   int `json:"running"`
	Stopped   int `json:"stopped"`
	Healthy   int `json:"healthy"`
	Unhealthy int `json:"unhealthy"`
	Total     int `json:"total"`
}

func CalculateContainerStats(containers []types.Container) ContainerStats {
	var running, stopped, healthy, unhealthy int
	for _, container := range containers {
		log.Debug().Str("containerId", container.ID).Str("state", container.State).Str("status", container.Status).Msg("Container info")

		switch container.State {
		case "running":
			running++
		case "exited", "stopped":
			stopped++
		}

		if strings.Contains(container.Status, "(healthy)") {
			healthy++
		}
		if strings.Contains(container.Status, "(unhealthy)") {
			unhealthy++
		}
	}

	return ContainerStats{
		Running:   running,
		Stopped:   stopped,
		Healthy:   healthy,
		Unhealthy: unhealthy,
		Total:     len(containers),
	}
}
