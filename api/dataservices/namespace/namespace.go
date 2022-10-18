package namespace

import (
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "namespaces"
)

// Service represents a service for managing data.
type Service struct {
	connection portainer.Connection
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	if err := connection.SetServiceName(BucketName); err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// Create namespace
func (service *Service) Create(namespace *portainer.Namespace) error {
	return service.connection.CreateObjectWithStringId(
		BucketName,
		[]byte(namespace.Name),
		namespace,
	)
}

// Delete namespace
func (service *Service) DeleteNamespace(name string) error {
	return service.connection.DeleteObject(BucketName, []byte(name))
}

// Update namespace
func (service *Service) UpdateNamespace(name string, namespace *portainer.Namespace) error {
	return service.connection.UpdateObject(BucketName, []byte(name), namespace)
}

func (service *Service) NamespaceByContainerID(containerID string) (*portainer.Namespace, error) {
	namespaces, err := service.Namespaces()
	if err != nil {
		logrus.Errorf("unable to retrieve namespaces from the database")
		return nil, fmt.Errorf("unable to retrieve namespaces from the database")
	}

	var namespace portainer.Namespace
	for _, item := range namespaces {
		if _, ok := item.Containers[containerID]; ok {
			namespace = item
			break
		}
	}
	return &namespace, nil
}

// Scene returns an namespace by name.
func (service *Service) Namespace(name string) (*portainer.Namespace, error) {
	var namespace portainer.Namespace

	err := service.connection.GetObject(BucketName, []byte(name), &namespace)
	if err != nil {
		return nil, err
	}
	return &namespace, nil
}

// Query namespace list
func (service *Service) Namespaces() ([]portainer.Namespace, error) {
	var namespaces = make([]portainer.Namespace, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.Namespace{},
		func(obj interface{}) (interface{}, error) {
			o, ok := obj.(*portainer.Namespace)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Namespace object")
				return nil, fmt.Errorf("Failed to convert to Namespace object: %s", obj)
			}
			namespaces = append(namespaces, *o)
			return &portainer.Namespace{}, nil
		})

	return namespaces, err
}
