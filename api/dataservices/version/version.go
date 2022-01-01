package version

import (
	"strconv"

	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName  = "version"
	versionKey  = "DB_VERSION"
	instanceKey = "INSTANCE_ID"
	editionKey  = "EDITION"
	updatingKey = "DB_UPDATING"
)

// Service represents a service to manage stored versions.
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

// DBVersion retrieves the stored database version.
func (service *Service) DBVersion() (int, error) {
	var version string
	err := service.connection.GetObject(BucketName, []byte(versionKey), &version)
	if err != nil {
		return 0, err
	}
	return strconv.Atoi(version)
}

// Edition retrieves the stored portainer edition.
func (service *Service) Edition() (portainer.SoftwareEdition, error) {
	var edition string
	err := service.connection.GetObject(BucketName, []byte(editionKey), &edition)
	if err != nil {
		return 0, err
	}
	e, err := strconv.Atoi(edition)
	if err != nil {
		return 0, err
	}
	return portainer.SoftwareEdition(e), nil
}

// StoreDBVersion store the database version.
func (service *Service) StoreDBVersion(version int) error {
	return service.connection.UpdateObject(BucketName, []byte(versionKey), strconv.Itoa(version))
}

// IsUpdating retrieves the database updating status.
func (service *Service) IsUpdating() (bool, error) {
	var isUpdating bool
	err := service.connection.GetObject(BucketName, []byte(updatingKey), &isUpdating)
	return isUpdating, err
}

// StoreIsUpdating store the database updating status.
func (service *Service) StoreIsUpdating(isUpdating bool) error {
	return service.connection.UpdateObject(BucketName, []byte(updatingKey), isUpdating)
}

// InstanceID retrieves the stored instance ID.
func (service *Service) InstanceID() (string, error) {
	var id string
	err := service.connection.GetObject(BucketName, []byte(instanceKey), &id)
	return id, err
}

// StoreInstanceID store the instance ID.
func (service *Service) StoreInstanceID(ID string) error {
	return service.connection.UpdateObject(BucketName, []byte(instanceKey), ID)

}
