package database

import (
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"
)

// NewDatabase should use config options to return a connection to the requested database
func NewDatabase(storeType, storePath string) (connection portainer.Connection, err error) {
	switch storeType {
	case "boltdb":
		return &boltdb.DbConnection{Path: storePath}, nil
	}
	return nil, fmt.Errorf("Unknown storage database: %s", storeType)
}
