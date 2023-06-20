package edgejob

import (
	"errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	service *Service
	tx      portainer.Transaction
}

func (service ServiceTx) BucketName() string {
	return BucketName
}

// EdgeJobs returns a list of Edge jobs
func (service ServiceTx) EdgeJobs() ([]portainer.EdgeJob, error) {
	var edgeJobs = make([]portainer.EdgeJob, 0)

	return edgeJobs, service.tx.GetAll(
		BucketName,
		&portainer.EdgeJob{},
		dataservices.AppendFn(&edgeJobs),
	)
}

// EdgeJob returns an Edge job by ID
func (service ServiceTx) EdgeJob(ID portainer.EdgeJobID) (*portainer.EdgeJob, error) {
	var edgeJob portainer.EdgeJob
	identifier := service.service.connection.ConvertToKey(int(ID))

	err := service.tx.GetObject(BucketName, identifier, &edgeJob)
	if err != nil {
		return nil, err
	}

	return &edgeJob, nil
}

// Create creates a new EdgeJob
func (service ServiceTx) Create(ID portainer.EdgeJobID, edgeJob *portainer.EdgeJob) error {
	edgeJob.ID = ID

	return service.tx.CreateObjectWithId(BucketName, int(edgeJob.ID), edgeJob)
}

// UpdateEdgeJob updates an edge job
func (service ServiceTx) UpdateEdgeJob(ID portainer.EdgeJobID, edgeJob *portainer.EdgeJob) error {
	identifier := service.service.connection.ConvertToKey(int(ID))
	return service.tx.UpdateObject(BucketName, identifier, edgeJob)
}

// UpdateEdgeJobFunc is a no-op inside a transaction.
func (service ServiceTx) UpdateEdgeJobFunc(ID portainer.EdgeJobID, updateFunc func(edgeJob *portainer.EdgeJob)) error {
	return errors.New("cannot be called inside a transaction")
}

// DeleteEdgeJob deletes an Edge job
func (service ServiceTx) DeleteEdgeJob(ID portainer.EdgeJobID) error {
	identifier := service.service.connection.ConvertToKey(int(ID))

	return service.tx.DeleteObject(BucketName, identifier)
}

// GetNextIdentifier returns the next identifier for an environment(endpoint).
func (service ServiceTx) GetNextIdentifier() int {
	return service.tx.GetNextIdentifier(BucketName)
}
