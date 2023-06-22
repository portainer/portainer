package customtemplate

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "customtemplates"

// Service represents a service for managing custom template data.
type Service struct {
	dataservices.BaseDataService[portainer.CustomTemplate, portainer.CustomTemplateID]
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.CustomTemplate, portainer.CustomTemplateID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

// CreateCustomTemplate uses the existing id and saves it.
// TODO: where does the ID come from, and is it safe?
func (service *Service) Create(customTemplate *portainer.CustomTemplate) error {
	return service.Connection.CreateObjectWithId(BucketName, int(customTemplate.ID), customTemplate)
}

// GetNextIdentifier returns the next identifier for a custom template.
func (service *Service) GetNextIdentifier() int {
	return service.Connection.GetNextIdentifier(BucketName)
}
