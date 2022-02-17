package fdoprofile

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "fdo_profiles"
)

// Service represents a service for managingFDO Profiles data.
type Service struct {
	connection portainer.Connection
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
		connection: connection,
	}, nil
}

// FDOProfiles return an array containing all the FDO Profiles.
func (service *Service) FDOProfiles() ([]portainer.FDOProfile, error) {
	var fdoProfiles = make([]portainer.FDOProfile, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.FDOProfile{},
		func(obj interface{}) (interface{}, error) {
			fdoProfile, ok := obj.(*portainer.FDOProfile)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to FDOProfile object")
				return nil, fmt.Errorf("failed to convert to FDOProfile object: %s", obj)
			}
			fdoProfiles = append(fdoProfiles, *fdoProfile)
			return &portainer.FDOProfile{}, nil
		})

	return fdoProfiles, err
}

// FDOProfile returns an FDO Profile by ID.
func (service *Service) FDOProfile(ID portainer.FDOProfileID) (*portainer.FDOProfile, error) {
	var FDOProfile portainer.FDOProfile
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &FDOProfile)
	if err != nil {
		return nil, err
	}

	return &FDOProfile, nil
}

// Create assign an ID to a new FDO Profile and saves it.
func (service *Service) Create(FDOProfile *portainer.FDOProfile) error {
	return service.connection.CreateObjectWithId(
		BucketName,
		int(FDOProfile.ID),
		FDOProfile,
	)
}

// Update updates an FDO Profile.
func (service *Service) Update(ID portainer.FDOProfileID, FDOProfile *portainer.FDOProfile) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, FDOProfile)
}

// Delete deletes an FDO Profile.
func (service *Service) Delete(ID portainer.FDOProfileID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// GetNextIdentifier returns the next identifier for a FDO Profile.
func (service *Service) GetNextIdentifier() int {
	return service.connection.GetNextIdentifier(BucketName)
}
