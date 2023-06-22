package dataservices

import (
	portainer "github.com/portainer/portainer/api"

	"golang.org/x/exp/constraints"
)

type BaseCRUD[T any, I constraints.Integer] interface {
	Create(element *T) error
	Read(ID I) (*T, error)
	ReadAll() ([]T, error)
	Update(ID I, element *T) error
	Delete(ID I) error
}

type BaseDataService[T any, I constraints.Integer] struct {
	Bucket     string
	Connection portainer.Connection
}

func (s *BaseDataService[T, I]) BucketName() string {
	return s.Bucket
}

func (service *BaseDataService[T, I]) Tx(tx portainer.Transaction) BaseDataServiceTx[T, I] {
	return BaseDataServiceTx[T, I]{
		Bucket:     service.Bucket,
		Connection: service.Connection,
		Tx:         tx,
	}
}

func (service BaseDataService[T, I]) Read(ID I) (*T, error) {
	var element *T

	return element, service.Connection.ViewTx(func(tx portainer.Transaction) error {
		var err error
		element, err = service.Tx(tx).Read(ID)

		return err
	})
}

func (service BaseDataService[T, I]) ReadAll() ([]T, error) {
	var collection = make([]T, 0)

	return collection, service.Connection.ViewTx(func(tx portainer.Transaction) error {
		var err error
		collection, err = service.Tx(tx).ReadAll()

		return err
	})
}

func (service BaseDataService[T, I]) Update(ID I, element *T) error {
	return service.Connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).Update(ID, element)
	})
}

func (service BaseDataService[T, I]) Delete(ID I) error {
	return service.Connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).Delete(ID)
	})
}
