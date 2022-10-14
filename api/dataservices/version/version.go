package version

import (
	"fmt"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/models"
)

// Service represents a service to manage stored versions.
type Service struct {
	connection portainer.Connection
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	return &Service{
		connection: connection,
	}, nil
}

// DBVersion retrieves the stored database version.
func (service *Service) DBVersion() (int, error) {
	db := service.connection.GetDB()
	var version models.Version
	tx := db.First(&version, `key = ?`, models.VersionKey)
	if tx.Error != nil {
		return 0, tx.Error
	}
	return strconv.Atoi(version.Value)
}

// Edition retrieves the stored portainer edition.
func (service *Service) Edition() (portainer.SoftwareEdition, error) {
	db := service.connection.GetDB()
	var version models.Version
	tx := db.First(&version, `key = ?`, models.EditionKey)
	if tx.Error != nil {
		return 0, tx.Error
	}
	e, err := strconv.Atoi(version.Value)
	if err != nil {
		return 0, err
	}
	return portainer.SoftwareEdition(e), nil
}

// StoreDBVersion store the database version.
func (service *Service) StoreDBVersion(v int) error {
	db := service.connection.GetDB()
	version := &models.Version{Key: models.VersionKey}
	fmt.Printf("## version %s", version)
	tx := db.Model(version).Update("value", strconv.FormatInt(int64(v), 10))
	if tx.Error != nil {
		return tx.Error
	}
	return nil
}

// IsUpdating retrieves the database updating status.
func (service *Service) IsUpdating() (bool, error) {
	db := service.connection.GetDB()
	var version models.Version
	tx := db.First(&version, `key = ?`, models.UpdatingKey)
	if tx.Error != nil {
		return false, tx.Error
	}
	return version.Value == "true", nil
}

// StoreIsUpdating store the database updating status.
func (service *Service) StoreIsUpdating(isUpdating bool) error {
	db := service.connection.GetDB()
	tx := db.Model(&models.Version{Key: models.UpdatingKey}).Update("value", strconv.FormatBool(isUpdating))
	if tx.Error != nil {
		return tx.Error
	}
	return nil
}

// InstanceID retrieves the stored instance ID.
func (service *Service) InstanceID() (string, error) {
	db := service.connection.GetDB()
	var version models.Version
	tx := db.First(&version, `key = ?`, models.InstanceKey)
	if tx.Error != nil {
		return "", tx.Error
	}
	return version.Value, nil
}

// StoreInstanceID store the instance ID.
func (service *Service) StoreInstanceID(ID string) error {
	db := service.connection.GetDB()
	tx := db.FirstOrCreate(&models.Version{Key: models.InstanceKey, Value: ID})
	if tx.Error != nil {
		return tx.Error
	}

	return nil
}
