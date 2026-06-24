package source

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "sources"

// Service represents a service for managing GitOps source data.
type Service struct {
	base dataservices.BaseDataService[portainer.Source, portainer.SourceID]
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		base: dataservices.BaseDataService[portainer.Source, portainer.SourceID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		base: dataservices.BaseDataServiceTx[portainer.Source, portainer.SourceID]{
			Bucket:     BucketName,
			Connection: service.base.Connection,
			Tx:         tx,
		},
	}
}

// Create creates a new source.
func (service *Service) Create(context UserContext, source *portainer.Source) error {
	return service.base.Connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).Create(context, source)
	})
}

func (service *Service) Read(context UserContext, ID portainer.SourceID) (*portainer.Source, error) {
	var result *portainer.Source

	err := service.base.Connection.ViewTx(func(tx portainer.Transaction) error {
		var err error
		result, err = service.Tx(tx).Read(context, ID)
		return err
	})

	return result, err
}

func (service *Service) Exists(context UserContext, ID portainer.SourceID) (bool, error) {
	var result bool

	err := service.base.Connection.ViewTx(func(tx portainer.Transaction) error {
		var err error
		result, err = service.Tx(tx).Exists(context, ID)
		return err
	})

	return result, err
}

func (service *Service) ReadAll(context UserContext, predicates ...func(portainer.Source) bool) ([]portainer.Source, error) {
	var result []portainer.Source

	err := service.base.Connection.ViewTx(func(tx portainer.Transaction) error {
		var err error
		result, err = service.Tx(tx).ReadAll(context, predicates...)
		return err
	})

	return result, err
}

func (service *Service) Update(context UserContext, ID portainer.SourceID, source *portainer.Source) error {
	return service.base.Connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).Update(context, ID, source)
	})
}

func (service *Service) Delete(context UserContext, ID portainer.SourceID) error {
	return service.base.Connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).Delete(context, ID)
	})
}

func (service *Service) FindOrCreateGitSource(context UserContext, source *portainer.Source) (*portainer.Source, error) {
	var result *portainer.Source

	err := service.base.Connection.UpdateTx(func(tx portainer.Transaction) error {
		var err error
		result, err = service.Tx(tx).FindOrCreateGitSource(context, source)
		return err
	})

	return result, err
}
