package customtemplate

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "customtemplates"

// Service represents a service for managing custom template data.
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

// CustomTemplates return an array containing all the custom templates.
func (service *Service) CustomTemplates() ([]portainer.CustomTemplate, error) {
	var customTemplates = make([]portainer.CustomTemplate, 0)

	return customTemplates, service.connection.GetAll(
		BucketName,
		&portainer.CustomTemplate{},
		dataservices.AppendFn(&customTemplates),
	)
}

// CustomTemplate returns an custom template by ID.
func (service *Service) CustomTemplate(ID portainer.CustomTemplateID) (*portainer.CustomTemplate, error) {
	var customTemplate portainer.CustomTemplate
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &customTemplate)
	if err != nil {
		return nil, err
	}

	return &customTemplate, nil
}

// UpdateCustomTemplate updates an custom template.
func (service *Service) UpdateCustomTemplate(ID portainer.CustomTemplateID, customTemplate *portainer.CustomTemplate) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, customTemplate)
}

// DeleteCustomTemplate deletes an custom template.
func (service *Service) DeleteCustomTemplate(ID portainer.CustomTemplateID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// CreateCustomTemplate uses the existing id and saves it.
// TODO: where does the ID come from, and is it safe?
func (service *Service) Create(customTemplate *portainer.CustomTemplate) error {
	return service.connection.CreateObjectWithId(BucketName, int(customTemplate.ID), customTemplate)
}

// GetNextIdentifier returns the next identifier for a custom template.
func (service *Service) GetNextIdentifier() int {
	return service.connection.GetNextIdentifier(BucketName)
}
