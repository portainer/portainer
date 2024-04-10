package docker

import (
	"context"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	_container "github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
	portainer "github.com/portainer/portainer/api"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/rs/zerolog/log"
)

// Snapshotter represents a service used to create environment(endpoint) snapshots
type Snapshotter struct {
	clientFactory *dockerclient.ClientFactory
}

// NewSnapshotter returns a new Snapshotter instance
func NewSnapshotter(clientFactory *dockerclient.ClientFactory) *Snapshotter {
	return &Snapshotter{
		clientFactory: clientFactory,
	}
}

// CreateSnapshot creates a snapshot of a specific Docker environment(endpoint)
func (snapshotter *Snapshotter) CreateSnapshot(endpoint *portainer.Endpoint) (*portainer.DockerSnapshot, error) {
	cli, err := snapshotter.clientFactory.CreateClient(endpoint, "", nil)
	if err != nil {
		return nil, err
	}
	defer cli.Close()

	return snapshot(cli, endpoint)
}

func snapshot(cli *client.Client, endpoint *portainer.Endpoint) (*portainer.DockerSnapshot, error) {
	_, err := cli.Ping(context.Background())
	if err != nil {
		return nil, err
	}

	snapshot := &portainer.DockerSnapshot{
		StackCount: 0,
	}

	err = snapshotInfo(snapshot, cli)
	if err != nil {
		log.Warn().Str("environment", endpoint.Name).Err(err).Msg("unable to snapshot engine information")
	}

	if snapshot.Swarm {
		err = snapshotSwarmServices(snapshot, cli)
		if err != nil {
			log.Warn().Str("environment", endpoint.Name).Err(err).Msg("unable to snapshot Swarm services")
		}

		err = snapshotNodes(snapshot, cli)
		if err != nil {
			log.Warn().Str("environment", endpoint.Name).Err(err).Msg("unable to snapshot Swarm nodes")
		}
	}

	err = snapshotContainers(snapshot, cli)
	if err != nil {
		log.Warn().Str("environment", endpoint.Name).Err(err).Msg("unable to snapshot containers")
	}

	err = snapshotImages(snapshot, cli)
	if err != nil {
		log.Warn().Str("environment", endpoint.Name).Err(err).Msg("unable to snapshot images")
	}

	err = snapshotVolumes(snapshot, cli)
	if err != nil {
		log.Warn().Str("environment", endpoint.Name).Err(err).Msg("unable to snapshot volumes")
	}

	err = snapshotNetworks(snapshot, cli)
	if err != nil {
		log.Warn().Str("environment", endpoint.Name).Err(err).Msg("unable to snapshot networks")
	}

	err = snapshotVersion(snapshot, cli)
	if err != nil {
		log.Warn().Str("environment", endpoint.Name).Err(err).Msg("unable to snapshot engine version")
	}

	snapshot.Time = time.Now().Unix()
	return snapshot, nil
}

func snapshotInfo(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
	info, err := cli.Info(context.Background())
	if err != nil {
		return err
	}

	snapshot.Swarm = info.Swarm.ControlAvailable
	snapshot.DockerVersion = info.ServerVersion
	snapshot.TotalCPU = info.NCPU
	snapshot.TotalMemory = info.MemTotal
	snapshot.SnapshotRaw.Info = info
	return nil
}

func snapshotNodes(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
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
	snapshot.NodeCount = len(nodes)
	return nil
}

func snapshotSwarmServices(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
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

func snapshotContainers(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
	containers, err := cli.ContainerList(context.Background(), container.ListOptions{All: true})
	if err != nil {
		return err
	}

	runningContainers := 0
	stoppedContainers := 0
	healthyContainers := 0
	unhealthyContainers := 0
	stacks := make(map[string]struct{})
	gpuUseSet := make(map[string]struct{})
	gpuUseAll := false
	for _, container := range containers {
		if container.State == "exited" || container.State == "stopped" {
			stoppedContainers++
		} else if container.State == "running" {
			runningContainers++

			// snapshot GPUs
			response, err := cli.ContainerInspect(context.Background(), container.ID)
			if err != nil {
				// Inspect a container will fail when the container runs on a different
				// Swarm node, so it is better to log the error instead of return error
				// when the Swarm mode is enabled
				if !snapshot.Swarm {
					return err
				} else {
					if !strings.Contains(err.Error(), "No such container") {
						return err
					}
					// It is common to have containers running on different Swarm nodes,
					// so we just log the error in the debug level
					log.Debug().Str("container", container.ID).Err(err).Msg("unable to inspect container in other Swarm nodes")
				}
			} else {
				var gpuOptions *_container.DeviceRequest = nil
				for _, deviceRequest := range response.HostConfig.Resources.DeviceRequests {
					deviceRequest := deviceRequest
					if deviceRequest.Driver == "nvidia" || deviceRequest.Capabilities[0][0] == "gpu" {
						gpuOptions = &deviceRequest
					}
				}

				if gpuOptions != nil {
					if gpuOptions.Count == -1 {
						gpuUseAll = true
					}
					for _, id := range gpuOptions.DeviceIDs {
						gpuUseSet[id] = struct{}{}
					}
				}
			}
		}

		if container.State == "healthy" {
			runningContainers++
			healthyContainers++
		}

		if container.State == "unhealthy" {
			unhealthyContainers++
		}

		for k, v := range container.Labels {
			if k == consts.ComposeStackNameLabel {
				stacks[v] = struct{}{}
			}
		}
	}

	gpuUseList := make([]string, 0, len(gpuUseSet))
	for gpuUse := range gpuUseSet {
		gpuUseList = append(gpuUseList, gpuUse)
	}

	snapshot.GpuUseAll = gpuUseAll
	snapshot.GpuUseList = gpuUseList

	snapshot.ContainerCount = len(containers)
	snapshot.RunningContainerCount = runningContainers
	snapshot.StoppedContainerCount = stoppedContainers
	snapshot.HealthyContainerCount = healthyContainers
	snapshot.UnhealthyContainerCount = unhealthyContainers
	snapshot.StackCount += len(stacks)
	for _, container := range containers {
		snapshot.SnapshotRaw.Containers = append(snapshot.SnapshotRaw.Containers, portainer.DockerContainerSnapshot{Container: container})
	}
	return nil
}

func snapshotImages(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
	images, err := cli.ImageList(context.Background(), types.ImageListOptions{})
	if err != nil {
		return err
	}

	snapshot.ImageCount = len(images)
	snapshot.SnapshotRaw.Images = images
	return nil
}

func snapshotVolumes(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
	volumes, err := cli.VolumeList(context.Background(), volume.ListOptions{})
	if err != nil {
		return err
	}

	snapshot.VolumeCount = len(volumes.Volumes)
	snapshot.SnapshotRaw.Volumes = volumes
	return nil
}

func snapshotNetworks(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
	networks, err := cli.NetworkList(context.Background(), types.NetworkListOptions{})
	if err != nil {
		return err
	}
	snapshot.SnapshotRaw.Networks = networks
	return nil
}

func snapshotVersion(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
	version, err := cli.ServerVersion(context.Background())
	if err != nil {
		return err
	}
	snapshot.SnapshotRaw.Version = version
	return nil
}
