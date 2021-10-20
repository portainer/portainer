package database

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"
)

// TODO: all the other files in this dir should actually ne in ../dataservices
//       but to do that, the migrator code needs decoupling, and i've run out of energy.

// NewDatabase should use config options to return a connection to the requested database
// ie, its going to be a factory at some point.
func NewDatabase(storePath string, fileService portainer.FileService) (connection portainer.Connection, err error) {
	return &boltdb.DbConnection{Path: storePath, FileService: fileService}, nil
}
