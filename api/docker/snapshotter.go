package docker

import (
	"github.com/portainer/portainer/api"
)

// Snapshotter represents a service used to create endpoint snapshots
type Snapshotter struct {
	clientFactory *ClientFactory
}

// NewSnapshotter returns a new Snapshotter instance
func NewSnapshotter(clientFactory *ClientFactory) *Snapshotter {
	return &Snapshotter{
		clientFactory: clientFactory,
	}
}

// CreateSnapshot creates a snapshot of a specific endpoint
func (snapshotter *Snapshotter) CreateSnapshot(endpoint *portainer.Endpoint) (*portainer.Snapshot, error) {
	cli, err := snapshotter.clientFactory.CreateClient(endpoint, "")
	if err != nil {
		return nil, err
	}
	defer cli.Close()

	return snapshot(cli, endpoint)
}
