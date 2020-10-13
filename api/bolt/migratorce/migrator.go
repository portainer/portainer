package migratorce

import (
	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api"
)

type (
	// Migrator defines a service to migrate data after a Portainer version update.
	Migrator struct {
		db               *bolt.DB
		currentDBVersion int
		currentEdition   portainer.SoftwareEdition
		versionService   portainer.VersionService
	}

	// Parameters represents the required parameters to create a new Migrator instance.
	Parameters struct {
		DB              *bolt.DB
		DatabaseVersion int
		CurrentEdition  portainer.SoftwareEdition
		VersionService  portainer.VersionService
	}
)

// NewMigrator creates a new Migrator.
func NewMigrator(parameters *Parameters) *Migrator {
	return &Migrator{
		db:               parameters.DB,
		currentDBVersion: parameters.DatabaseVersion,
		currentEdition:   parameters.CurrentEdition,
		versionService:   parameters.VersionService,
	}
}
