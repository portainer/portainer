package docker

import "github.com/docker/docker/api/types"

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
		switch container.State {
		case "running":
			running++
		case "healthy":
			running++
			healthy++
		case "unhealthy":
			running++
			unhealthy++
		case "exited", "stopped":
			stopped++
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
