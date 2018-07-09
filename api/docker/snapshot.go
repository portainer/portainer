package docker

import (
	"context"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/portainer/portainer"
)

// TODO: should probably be refactored
func snapshot(cli *client.Client) (*portainer.Snapshot, error) {
	_, err := cli.Ping(context.Background())
	if err != nil {
		return nil, err
	}

	info, err := cli.Info(context.Background())
	if err != nil {
		return nil, err
	}

	stackCount := 0
	serviceCount := 0

	isSwarmManager := info.Swarm.ControlAvailable
	if isSwarmManager {
		swarmStackNames := map[string]int{}

		services, err := cli.ServiceList(context.Background(), types.ServiceListOptions{})
		if err != nil {
			return nil, err
		}

		for _, service := range services {
			for k, v := range service.Spec.Labels {
				if k == "com.docker.stack.namespace" {
					swarmStackNames[v] = 1
				}
			}
		}

		serviceCount = len(services)
		stackCount = len(swarmStackNames)
	}

	containers, err := cli.ContainerList(context.Background(), types.ContainerListOptions{All: true})
	if err != nil {
		return nil, err
	}

	runningContainers := 0
	stoppedContainers := 0
	composeStackNames := map[string]int{}

	for _, container := range containers {
		if container.State == "exited" {
			stoppedContainers++
		} else if container.State == "running" {
			runningContainers++
		}

		for k, v := range container.Labels {
			if k == "com.docker.compose.project" {
				composeStackNames[v] = 1
			}
		}
	}

	stackCount += len(composeStackNames)

	images, err := cli.ImageList(context.Background(), types.ImageListOptions{})
	if err != nil {
		return nil, err
	}

	volumes, err := cli.VolumeList(context.Background(), filters.Args{})
	if err != nil {
		return nil, err
	}

	now := time.Now()
	snapshot := &portainer.Snapshot{
		Time:                  now.Unix(),
		Swarm:                 isSwarmManager,
		DockerVersion:         info.ServerVersion,
		TotalCPU:              info.NCPU,
		TotalMemory:           info.MemTotal,
		RunningContainerCount: runningContainers,
		StoppedContainerCount: stoppedContainers,
		ServiceCount:          serviceCount,
		StackCount:            stackCount,
		ImageCount:            len(images),
		VolumeCount:           len(volumes.Volumes),
	}

	return snapshot, nil
}
