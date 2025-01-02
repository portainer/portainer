package docker

import (
	portainer "github.com/portainer/portainer/api"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/pkg/snapshot"
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

	return snapshot.CreateDockerSnapshot(cli)
}
