package database

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/sqlite"
)

// NewDatabase should use config options to return a connection to the requested database
func NewDatabase(storeType, storePath string, encryptionKey []byte) (connection portainer.Connection, err error) {
	if storeType == "sqlite" {
		return &sqlite.DbConnection{
			Path:          storePath,
			EncryptionKey: encryptionKey,
		}, nil
	}

	return nil, fmt.Errorf("Unknown storage database: %s", storeType)
}
