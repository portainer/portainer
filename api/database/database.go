package database

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"
)

// NewDatabase should use config options to return a connection to the requested database
// ie, its going to be a factory at some point.
func NewDatabase(storePath string) (connection portainer.Connection, err error) {
	return &boltdb.DbConnection{Path: storePath}, nil
}
