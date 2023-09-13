package fdoprofile

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "fdo_profiles"

// Service represents a service for managingFDO Profiles data.
type Service struct {
	dataservices.BaseDataService[portainer.FDOProfile, portainer.FDOProfileID]
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.FDOProfile, portainer.FDOProfileID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

// Create assign an ID to a new FDO Profile and saves it.
func (service *Service) Create(FDOProfile *portainer.FDOProfile) error {
	return service.Connection.CreateObjectWithId(
		BucketName,
		int(FDOProfile.ID),
		FDOProfile,
	)
}

// GetNextIdentifier returns the next identifier for a FDO Profile.
func (service *Service) GetNextIdentifier() int {
	return service.Connection.GetNextIdentifier(BucketName)
}
