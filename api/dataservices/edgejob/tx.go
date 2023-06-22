package edgejob

import (
	"errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.EdgeJob, portainer.EdgeJobID]
}

// Create creates a new EdgeJob
func (service ServiceTx) Create(edgeJob *portainer.EdgeJob) error {
	return service.CreateWithID(portainer.EdgeJobID(service.GetNextIdentifier()), edgeJob)
}

// CreateWithID creates a new EdgeJob
func (service ServiceTx) CreateWithID(ID portainer.EdgeJobID, edgeJob *portainer.EdgeJob) error {
	edgeJob.ID = ID

	return service.Tx.CreateObjectWithId(BucketName, int(edgeJob.ID), edgeJob)
}

// UpdateEdgeJobFunc is a no-op inside a transaction.
func (service ServiceTx) UpdateEdgeJobFunc(ID portainer.EdgeJobID, updateFunc func(edgeJob *portainer.EdgeJob)) error {
	return errors.New("cannot be called inside a transaction")
}

// GetNextIdentifier returns the next identifier for an environment(endpoint).
func (service ServiceTx) GetNextIdentifier() int {
	return service.Tx.GetNextIdentifier(BucketName)
}
