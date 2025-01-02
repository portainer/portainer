package kubernetes

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/pkg/snapshot"
)

type Snapshotter struct {
	clientFactory *cli.ClientFactory
}

// NewSnapshotter returns a new Snapshotter instance
func NewSnapshotter(clientFactory *cli.ClientFactory) *Snapshotter {
	return &Snapshotter{
		clientFactory: clientFactory,
	}
}

// CreateSnapshot creates a snapshot of a specific Kubernetes environment(endpoint)
func (snapshotter *Snapshotter) CreateSnapshot(endpoint *portainer.Endpoint) (*portainer.KubernetesSnapshot, error) {
	client, err := snapshotter.clientFactory.CreateClient(endpoint)
	if err != nil {
		return nil, err
	}

	return snapshot.CreateKubernetesSnapshot(client)
}
