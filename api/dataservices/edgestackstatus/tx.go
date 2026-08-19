package edgestackstatus

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

var _ dataservices.EdgeStackStatusService = &Service{}

type ServiceTx struct {
	service *Service
	tx      portainer.Transaction
}

func (service ServiceTx) Create(edgeStackID portainer.EdgeStackID, endpointID portainer.EndpointID, status *portainer.EdgeStackStatusForEnv) error {
	identifier := service.service.key(edgeStackID, endpointID)
	return service.tx.CreateObjectWithStringId(BucketName, identifier, status)
}

func (s ServiceTx) Read(edgeStackID portainer.EdgeStackID, endpointID portainer.EndpointID) (*portainer.EdgeStackStatusForEnv, error) {
	var status portainer.EdgeStackStatusForEnv
	identifier := s.service.key(edgeStackID, endpointID)

	if err := s.tx.GetObject(BucketName, identifier, &status); err != nil {
		return nil, err
	}

	return &status, nil
}

func (s ServiceTx) ReadAll(edgeStackID portainer.EdgeStackID) ([]portainer.EdgeStackStatusForEnv, error) {
	keyPrefix := s.service.conn.ConvertToKey(int(edgeStackID))

	statuses := make([]portainer.EdgeStackStatusForEnv, 0)

	if err := s.tx.GetAllWithKeyPrefix(BucketName, keyPrefix, &portainer.EdgeStackStatusForEnv{}, dataservices.AppendFn(&statuses)); err != nil {
		return nil, fmt.Errorf("unable to retrieve EdgeStackStatus for EdgeStack %d: %w", edgeStackID, err)
	}

	return statuses, nil
}

func (s ServiceTx) Update(edgeStackID portainer.EdgeStackID, endpointID portainer.EndpointID, status *portainer.EdgeStackStatusForEnv) error {
	identifier := s.service.key(edgeStackID, endpointID)
	return s.tx.UpdateObject(BucketName, identifier, status)
}

func (s ServiceTx) Delete(edgeStackID portainer.EdgeStackID, endpointID portainer.EndpointID) error {
	identifier := s.service.key(edgeStackID, endpointID)
	return s.tx.DeleteObject(BucketName, identifier)
}

func (s ServiceTx) DeleteAll(edgeStackID portainer.EdgeStackID) error {
	keyPrefix := s.service.conn.ConvertToKey(int(edgeStackID))

	statuses := make([]portainer.EdgeStackStatusForEnv, 0)

	if err := s.tx.GetAllWithKeyPrefix(BucketName, keyPrefix, &portainer.EdgeStackStatusForEnv{}, dataservices.AppendFn(&statuses)); err != nil {
		return fmt.Errorf("unable to retrieve EdgeStackStatus for EdgeStack %d: %w", edgeStackID, err)
	}

	for _, status := range statuses {
		if err := s.tx.DeleteObject(BucketName, s.service.key(edgeStackID, status.EndpointID)); err != nil {
			return fmt.Errorf("unable to delete EdgeStackStatus for EdgeStack %d and Endpoint %d: %w", edgeStackID, status.EndpointID, err)
		}
	}

	return nil
}

func (s ServiceTx) Clear(edgeStackID portainer.EdgeStackID, relatedEnvironmentsIDs []portainer.EndpointID) error {
	for _, envID := range relatedEnvironmentsIDs {
		existingStatus, err := s.Read(edgeStackID, envID)
		if err != nil && !dataservices.IsErrObjectNotFound(err) {
			return fmt.Errorf("unable to retrieve status for environment %d: %w", envID, err)
		}

		var deploymentInfo portainer.StackDeploymentInfo
		if existingStatus != nil {
			deploymentInfo = existingStatus.DeploymentInfo
		}

		if err := s.Update(edgeStackID, envID, &portainer.EdgeStackStatusForEnv{
			EndpointID:     envID,
			Status:         []portainer.EdgeStackDeploymentStatus{},
			DeploymentInfo: deploymentInfo,
		}); err != nil {
			return err
		}
	}

	return nil
}
