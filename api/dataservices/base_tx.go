package dataservices

import (
	portainer "github.com/portainer/portainer/api"

	"golang.org/x/exp/constraints"
)

type BaseDataServiceTx[T any, I constraints.Integer] struct {
	Bucket     string
	Connection portainer.Connection
	Tx         portainer.Transaction
}

func (service BaseDataServiceTx[T, I]) BucketName() string {
	return service.Bucket
}

func (service BaseDataServiceTx[T, I]) Read(ID I) (*T, error) {
	var element T
	identifier := service.Connection.ConvertToKey(int(ID))

	err := service.Tx.GetObject(service.Bucket, identifier, &element)
	if err != nil {
		return nil, err
	}

	return &element, nil
}

func (service BaseDataServiceTx[T, I]) Exists(ID I) (bool, error) {
	identifier := service.Connection.ConvertToKey(int(ID))

	return service.Tx.KeyExists(service.Bucket, identifier)
}

// ReadAll retrieves all the elements that satisfy all the provided predicates.
func (service BaseDataServiceTx[T, I]) ReadAll(predicates ...func(T) bool) ([]T, error) {
	var collection = make([]T, 0)

	if len(predicates) == 0 {
		return collection, service.Tx.GetAll(
			service.Bucket,
			new(T),
			AppendFn(&collection),
		)
	}

	filterFn := func(element T) bool {
		for _, p := range predicates {
			if !p(element) {
				return false
			}
		}

		return true
	}

	return collection, service.Tx.GetAll(
		service.Bucket,
		new(T),
		FilterFn(&collection, filterFn),
	)
}

func (service BaseDataServiceTx[T, I]) Update(ID I, element *T) error {
	identifier := service.Connection.ConvertToKey(int(ID))
	return service.Tx.UpdateObject(service.Bucket, identifier, element)
}

func (service BaseDataServiceTx[T, I]) Delete(ID I) error {
	identifier := service.Connection.ConvertToKey(int(ID))
	return service.Tx.DeleteObject(service.Bucket, identifier)
}

func Read[T any](tx portainer.Transaction, bucket string, key []byte) (*T, error) {
	var element T

	if err := tx.GetObject(bucket, key, &element); err != nil {
		return nil, err
	}

	return &element, nil
}
