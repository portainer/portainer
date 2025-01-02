package snapshot

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker/consts"
	edgeutils "github.com/portainer/portainer/pkg/edge"
	networkingutils "github.com/portainer/portainer/pkg/networking"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	_container "github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
)

func CreateDockerSnapshot(cli *client.Client) (*portainer.DockerSnapshot, error) {
	if _, err := cli.Ping(context.Background()); err != nil {
		return nil, err
	}

	dockerSnapshot := &portainer.DockerSnapshot{}

	if err := dockerSnapshotInfo(dockerSnapshot, cli); err != nil {
		log.Warn().Err(err).Msg("unable to snapshot engine information")
	}

	if dockerSnapshot.Swarm {
		if err := dockerSnapshotSwarmServices(dockerSnapshot, cli); err != nil {
			log.Warn().Err(err).Msg("unable to snapshot Swarm services")
		}

		if err := dockerSnapshotNodes(dockerSnapshot, cli); err != nil {
			log.Warn().Err(err).Msg("unable to snapshot Swarm nodes")
		}
	}

	if err := dockerSnapshotContainers(dockerSnapshot, cli); err != nil {
		log.Warn().Err(err).Msg("unable to snapshot containers")
	}

	if err := dockerSnapshotImages(dockerSnapshot, cli); err != nil {
		log.Warn().Err(err).Msg("unable to snapshot images")
	}

	if err := dockerSnapshotVolumes(dockerSnapshot, cli); err != nil {
		log.Warn().Err(err).Msg("unable to snapshot volumes")
	}

	if err := dockerSnapshotNetworks(dockerSnapshot, cli); err != nil {
		log.Warn().Err(err).Msg("unable to snapshot networks")
	}

	if err := dockerSnapshotVersion(dockerSnapshot, cli); err != nil {
		log.Warn().Err(err).Msg("unable to snapshot engine version")
	}

	dockerSnapshot.Time = time.Now().Unix()

	return dockerSnapshot, nil
}

func dockerSnapshotInfo(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
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

func dockerSnapshotNodes(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
	nodes, err := cli.NodeList(context.Background(), types.NodeListOptions{})
	if err != nil {
		return err
	}

	var nanoCpus, totalMem int64

	for _, node := range nodes {
		nanoCpus += node.Description.Resources.NanoCPUs
		totalMem += node.Description.Resources.MemoryBytes
	}

	snapshot.TotalCPU = int(nanoCpus / 1e9)
	snapshot.TotalMemory = totalMem
	snapshot.NodeCount = len(nodes)

	return nil
}

func dockerSnapshotSwarmServices(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
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

func dockerSnapshotContainers(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
	containers, err := cli.ContainerList(context.Background(), container.ListOptions{All: true})
	if err != nil {
		return err
	}

	stacks := make(map[string]struct{})
	gpuUseSet := make(map[string]struct{})
	gpuUseAll := false

	for _, container := range containers {
		for k, v := range container.Labels {
			if k == consts.ComposeStackNameLabel {
				stacks[v] = struct{}{}
			}
		}

		if container.State != "running" {
			continue
		}

		// Snapshot GPUs
		response, err := cli.ContainerInspect(context.Background(), container.ID)
		if err != nil && !snapshot.Swarm {
			return err
		} else if err != nil {
			// Inspect a container will fail when the container runs on a different
			// Swarm node, so it is better to log the error instead of return error
			// when the Swarm mode is enabled
			if !strings.Contains(err.Error(), "No such container") {
				return err
			}

			// It is common to have containers running on different Swarm nodes,
			// so we just log the error in the debug level
			log.Debug().Str("container", container.ID).Err(err).Msg("unable to inspect container in other Swarm nodes")

			continue
		}

		var gpuOptions *_container.DeviceRequest

		for _, deviceRequest := range response.HostConfig.Resources.DeviceRequests {
			if deviceRequest.Driver == "nvidia" || deviceRequest.Capabilities[0][0] == "gpu" {
				gpuOptions = &deviceRequest
			}
		}

		if gpuOptions == nil {
			continue
		}

		if gpuOptions.Count == -1 {
			gpuUseAll = true
		}

		for _, id := range gpuOptions.DeviceIDs {
			gpuUseSet[id] = struct{}{}
		}
	}

	gpuUseList := make([]string, 0, len(gpuUseSet))
	for gpuUse := range gpuUseSet {
		gpuUseList = append(gpuUseList, gpuUse)
	}

	snapshot.GpuUseAll = gpuUseAll
	snapshot.GpuUseList = gpuUseList

	stats := calculateContainerStats(containers)

	snapshot.ContainerCount = stats.Total
	snapshot.RunningContainerCount = stats.Running
	snapshot.StoppedContainerCount = stats.Stopped
	snapshot.HealthyContainerCount = stats.Healthy
	snapshot.UnhealthyContainerCount = stats.Unhealthy
	snapshot.StackCount += len(stacks)

	for _, container := range containers {
		snapshot.SnapshotRaw.Containers = append(snapshot.SnapshotRaw.Containers, portainer.DockerContainerSnapshot{Container: container})
	}

	return nil
}

func dockerSnapshotImages(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
	images, err := cli.ImageList(context.Background(), image.ListOptions{})
	if err != nil {
		return err
	}

	snapshot.ImageCount = len(images)
	snapshot.SnapshotRaw.Images = images

	return nil
}

func dockerSnapshotVolumes(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
	volumes, err := cli.VolumeList(context.Background(), volume.ListOptions{})
	if err != nil {
		return err
	}

	snapshot.VolumeCount = len(volumes.Volumes)
	snapshot.SnapshotRaw.Volumes = volumes

	return nil
}

func dockerSnapshotNetworks(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
	networks, err := cli.NetworkList(context.Background(), types.NetworkListOptions{})
	if err != nil {
		return err
	}

	snapshot.SnapshotRaw.Networks = networks

	return nil
}

func dockerSnapshotVersion(snapshot *portainer.DockerSnapshot, cli *client.Client) error {
	version, err := cli.ServerVersion(context.Background())
	if err != nil {
		return err
	}

	snapshot.SnapshotRaw.Version = version
	snapshot.IsPodman = isPodman(version)

	return nil
}

// DockerSnapshotDiagnostics returns the diagnostics data for the agent
func DockerSnapshotDiagnostics(cli *client.Client, edgeKey string) (*portainer.DiagnosticsData, error) {
	containerID := os.Getenv("HOSTNAME")
	snapshot := &portainer.DockerSnapshot{
		DiagnosticsData: &portainer.DiagnosticsData{
			DNS:    make(map[string]string),
			Telnet: make(map[string]string),
		},
	}

	if err := dockerSnapshotContainerErrorLogs(snapshot, cli, containerID); err != nil {
		return nil, err
	}

	if edgeKey == "" {
		return snapshot.DiagnosticsData, nil
	}

	url, err := edgeutils.GetPortainerURLFromEdgeKey(edgeKey)
	if err != nil {
		return nil, fmt.Errorf("failed to get portainer URL from edge key: %w", err)
	}

	snapshot.DiagnosticsData.DNS["edge-to-portainer"] = networkingutils.ProbeDNSConnection(url)
	snapshot.DiagnosticsData.Telnet["edge-to-portainer"] = networkingutils.ProbeTelnetConnection(url)

	return snapshot.DiagnosticsData, nil
}

// DockerSnapshotContainerErrorLogs returns the 5 most recent error logs of the agent container
// this will primarily be used for agent snapshot
func dockerSnapshotContainerErrorLogs(snapshot *portainer.DockerSnapshot, cli *client.Client, containerId string) error {
	if containerId == "" {
		return nil
	}

	rd, err := cli.ContainerLogs(context.Background(), containerId, container.LogsOptions{
		ShowStdout: false,
		ShowStderr: true,
		Tail:       "5",
		Timestamps: true,
	})
	if err != nil {
		return fmt.Errorf("failed to get container logs: %w", err)
	}
	defer rd.Close()

	var stdOut, stdErr bytes.Buffer
	if _, err := stdcopy.StdCopy(&stdErr, &stdOut, rd); err != nil {
		return fmt.Errorf("failed to copy error logs: %w", err)
	}

	var logs []map[string]string
	jsonLogs, err := json.Marshal(logs)
	if err != nil {
		return fmt.Errorf("failed to marshal logs to JSON: %w", err)
	}

	snapshot.DiagnosticsData.Log = string(jsonLogs)

	return nil
}

// isPodman checks if the version is for Podman by checking if any of the components contain "podman".
// If it's podman, a component name should be "Podman Engine"
func isPodman(version types.Version) bool {
	for _, component := range version.Components {
		if strings.Contains(strings.ToLower(component.Name), "podman") {
			return true
		}
	}

	return false
}

type ContainerStats struct {
	Running   int
	Stopped   int
	Healthy   int
	Unhealthy int
	Total     int
}

func calculateContainerStats(containers []types.Container) ContainerStats {
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
