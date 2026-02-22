package replicationschedule

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "replication_schedules"

// Service represents a service for managing replication schedule data.
type Service struct {
	dataservices.BaseDataService[portainer.ReplicationSchedule, portainer.ReplicationScheduleID]
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.ReplicationSchedule, portainer.ReplicationScheduleID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		BaseDataServiceTx: dataservices.BaseDataServiceTx[portainer.ReplicationSchedule, portainer.ReplicationScheduleID]{
			Bucket:     BucketName,
			Connection: service.Connection,
			Tx:         tx,
		},
	}
}

// Create assigns an ID to a new replication schedule and saves it.
func (service *Service) Create(schedule *portainer.ReplicationSchedule) error {
	return service.Connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).Create(schedule)
	})
}

func (service *Service) GetNextIdentifier() int {
	var identifier int

	_ = service.Connection.UpdateTx(func(tx portainer.Transaction) error {
		identifier = service.Tx(tx).GetNextIdentifier()
		return nil
	})

	return identifier
}
