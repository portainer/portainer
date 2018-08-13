package docker

import (
	"context"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/portainer/portainer"
)

func snapshot(cli *client.Client) (*portainer.Snapshot, error) {
	_, err := cli.Ping(context.Background())
	if err != nil {
		return nil, err
	}

	snapshot := &portainer.Snapshot{
		StackCount: 0,
	}

	err = snapshotInfo(snapshot, cli)
	if err != nil {
		return nil, err
	}

	if snapshot.Swarm {
		err = snapshotSwarmServices(snapshot, cli)
		if err != nil {
			return nil, err
		}

		err = snapshotNodes(snapshot, cli)
		if err != nil {
			return nil, err
		}
	}

	err = snapshotContainers(snapshot, cli)
	if err != nil {
		return nil, err
	}

	err = snapshotImages(snapshot, cli)
	if err != nil {
		return nil, err
	}

	err = snapshotVolumes(snapshot, cli)
	if err != nil {
		return nil, err
	}

	snapshot.Time = time.Now().Unix()
	return snapshot, nil
}

func snapshotInfo(snapshot *portainer.Snapshot, cli *client.Client) error {
	info, err := cli.Info(context.Background())
	if err != nil {
		return err
	}

	snapshot.Swarm = info.Swarm.ControlAvailable
	snapshot.DockerVersion = info.ServerVersion
	snapshot.TotalCPU = info.NCPU
	snapshot.TotalMemory = info.MemTotal
	return nil
}

func snapshotNodes(snapshot *portainer.Snapshot, cli *client.Client) error {
	nodes, err := cli.NodeList(context.Background(), types.NodeListOptions{})
	if err != nil {
		return err
	}
	var nanoCpus int64
	var totalMem int64
	for _, node := range nodes {
		nanoCpus += node.Description.Resources.NanoCPUs
		totalMem += node.Description.Resources.MemoryBytes
	}
	snapshot.TotalCPU = int(nanoCpus / 1e9)
	snapshot.TotalMemory = totalMem
	return nil
}

func snapshotSwarmServices(snapshot *portainer.Snapshot, cli *client.Client) error {
	stacks := make(map[string]struct{})

	services, err := cli.ServiceList(context.Background(), types.ServiceListOptions{})
	if err != nil {
		return err
	}

	for _, service := range services {
		for k, v := range service.Spec.Labels {
			if k == "com.docker.stack.namespace" {
				stacks[v] = struct{}{}
			}
		}
	}

	snapshot.ServiceCount = len(services)
	snapshot.StackCount += len(stacks)
	return nil
}

func snapshotContainers(snapshot *portainer.Snapshot, cli *client.Client) error {
	containers, err := cli.ContainerList(context.Background(), types.ContainerListOptions{All: true})
	if err != nil {
		return err
	}

	runningContainers := 0
	stoppedContainers := 0
	stacks := make(map[string]struct{})
	for _, container := range containers {
		if container.State == "exited" {
			stoppedContainers++
		} else if container.State == "running" {
			runningContainers++
		}

		for k, v := range container.Labels {
			if k == "com.docker.compose.project" {
				stacks[v] = struct{}{}
			}
		}
	}

	snapshot.RunningContainerCount = runningContainers
	snapshot.StoppedContainerCount = stoppedContainers
	snapshot.StackCount += len(stacks)
	return nil
}

func snapshotImages(snapshot *portainer.Snapshot, cli *client.Client) error {
	images, err := cli.ImageList(context.Background(), types.ImageListOptions{})
	if err != nil {
		return err
	}

	snapshot.ImageCount = len(images)
	return nil
}

func snapshotVolumes(snapshot *portainer.Snapshot, cli *client.Client) error {
	volumes, err := cli.VolumeList(context.Background(), filters.Args{})
	if err != nil {
		return err
	}

	snapshot.VolumeCount = len(volumes.Volumes)
	return nil
}
