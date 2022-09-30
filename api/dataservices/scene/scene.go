package scene

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "scenes"
)

// Service represents a service for managing environment(endpoint) data.
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

// Create Scene
func (service *Service) Create(scene *portainer.Scene) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			scene.ID = int(id)
			return scene.ID, scene
		},
	)
}

// Delete Scene
func (service *Service) DeleteScene(ID int) error {
	identifier := service.connection.ConvertToKey(ID)
	return service.connection.DeleteObject(BucketName, identifier)
}

// Update Scene
func (service *Service) UpdateScene(ID int, scene *portainer.Scene) error {
	identifier := service.connection.ConvertToKey(ID)
	return service.connection.UpdateObject(BucketName, identifier, scene)
}

// Scene returns an scenes by ID.
func (service *Service) Scene(ID int) (*portainer.Scene, error) {
	var scene portainer.Scene
	identifier := service.connection.ConvertToKey(ID)

	err := service.connection.GetObject(BucketName, identifier, &scene)
	if err != nil {
		return nil, err
	}
	return &scene, nil
}

// Query Scene list
func (service *Service) Scenes() ([]portainer.Scene, error) {
	var scenes = make([]portainer.Scene, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.Scene{},
		func(obj interface{}) (interface{}, error) {
			scene, ok := obj.(*portainer.Scene)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Scene object")
				return nil, fmt.Errorf("Failed to convert to Scene object: %s", obj)
			}
			scenes = append(scenes, *scene)
			return &portainer.Scene{}, nil
		})

	return scenes, err
}
