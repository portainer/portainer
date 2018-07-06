package docker

import (
	// "bitbucket.org/portainer/agent"
	// "bitbucket.org/portainer/agent"

	"context"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/portainer/portainer"
)

// Snapshotter represents a service used to create endpoint snapshots
type Snapshotter struct {
}

// NewSnapshotter returns a new Snapshotter instance
func NewSnapshotter() *Snapshotter {
	return &Snapshotter{}
}

func createClient(endpoint *portainer.Endpoint) (*client.Client, error) {

	// TODO: define a client for each type of endpoints
	// Local (unix), current setup works
	// Remote (http), current setup works
	// Remote (https)
	// Agent (https, self signed)

	// httpClient := http.Client{
	// 	Timeout: time.Second * 5,
	// }

	return client.NewClientWithOpts(
		// client.WithHTTPClient(&httpClient),
		client.WithHost(endpoint.URL),
		client.WithVersion(portainer.SupportedDockerAPIVersion),
	)
}

// CreateSnapshot creates a snapshot of an endpoint
func (snapshotter *Snapshotter) CreateSnapshot(endpoint *portainer.Endpoint) (*portainer.Snapshot, error) {
	cli, err := createClient(endpoint)
	if err != nil {
		return nil, err
	}

	// TODO: define snapshot content
	info, err := cli.Info(context.Background())
	if err != nil {
		return nil, err
	}

	containers, err := cli.ContainerList(context.Background(), types.ContainerListOptions{All: true})
	if err != nil {
		return nil, err
	}

	runningContainers := make([]types.Container, 0)
	stoppedContainers := make([]types.Container, 0)
	for _, container := range containers {
		if container.State == "exited" {
			stoppedContainers = append(stoppedContainers, container)
		} else if container.State == "running" {
			runningContainers = append(runningContainers, container)
		}
	}

	now := time.Now()
	snapshot := &portainer.Snapshot{
		Time:              now.Unix(),
		Swarm:             info.Swarm.ControlAvailable,
		DockerVersion:     info.ServerVersion,
		TotalCPU:          info.NCPU,
		TotalMemory:       info.MemTotal,
		ContainersRunning: len(runningContainers),
		ContainersStopped: len(stoppedContainers),
	}

	return snapshot, nil
}
