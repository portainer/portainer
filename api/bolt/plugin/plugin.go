package plugin

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "plugin"
)

// Service represents a service for managing endpoint data.
type Service struct {
	db *bolt.DB
}

// NewService creates a new instance of a service.
func NewService(db *bolt.DB) (*Service, error) {
	err := internal.CreateBucket(db, BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		db: db,
	}, nil
}

// Plugins return an array containing all the plugins.
func (service *Service) Plugins() ([]portainer.Plugin, error) {
	var plugins = make([]portainer.Plugin, 0)

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var plugin portainer.Plugin
			err := internal.UnmarshalObject(v, &plugin)
			if err != nil {
				return err
			}
			plugins = append(plugins, plugin)
		}

		return nil
	})

	return plugins, err
}

// Persist persists a plugin inside the database.
func (service *Service) Persist(plugin *portainer.Plugin) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		data, err := internal.MarshalObject(plugin)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(plugin.ID)), data)
	})
}

// TODO: remove?
//
// // DeletePlugin deletes a Plugin.
// func (service *Service) DeletePlugin(ID portainer.PluginID) error {
// 	identifier := internal.Itob(int(ID))
// 	return internal.DeleteObject(service.db, BucketName, identifier)
// }
