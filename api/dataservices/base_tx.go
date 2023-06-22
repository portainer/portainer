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

func (service BaseDataServiceTx[T, I]) ReadAll() ([]T, error) {
	var collection = make([]T, 0)

	return collection, service.Tx.GetAllWithJsoniter(
		service.Bucket,
		new(T),
		AppendFn(&collection),
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
