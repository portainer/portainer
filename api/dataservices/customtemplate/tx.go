package customtemplate

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// Service represents a service for managing custom template data.
type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.CustomTemplate, portainer.CustomTemplateID]
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		BaseDataServiceTx: dataservices.BaseDataServiceTx[portainer.CustomTemplate, portainer.CustomTemplateID]{
			Bucket:     BucketName,
			Connection: service.Connection,
			Tx:         tx,
		},
	}
}

func (service ServiceTx) GetNextIdentifier() int {
	return service.Tx.GetNextIdentifier(BucketName)
}

// CreateCustomTemplate uses the existing id and saves it.
// TODO: where does the ID come from, and is it safe?
func (service ServiceTx) Create(customTemplate *portainer.CustomTemplate) error {
	return service.Tx.CreateObjectWithId(BucketName, int(customTemplate.ID), customTemplate)
}
