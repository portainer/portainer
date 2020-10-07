package migratoree

import (
	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/endpoint"
	"github.com/portainer/portainer/api/bolt/endpointgroup"
	"github.com/portainer/portainer/api/bolt/extension"
	"github.com/portainer/portainer/api/internal/authorization"
)

type (
	// Migrator defines a service to migrate data after a Portainer version update.
	Migrator struct {
		db               *bolt.DB
		currentDBVersion int
		currentEdition   portainer.SoftwareEdition

		authorizationService *authorization.Service
		endpointGroupService *endpointgroup.Service
		endpointService      *endpoint.Service
		extensionService     *extension.Service
		versionService       portainer.VersionService
	}

	// Parameters represents the required parameters to create a new Migrator instance.
	Parameters struct {
		DB              *bolt.DB
		DatabaseVersion int
		CurrentEdition  portainer.SoftwareEdition

		AuthorizationService *authorization.Service
		EndpointGroupService *endpointgroup.Service
		EndpointService      *endpoint.Service
		ExtensionService     *extension.Service
		VersionService       portainer.VersionService
	}
)

// NewMigrator creates a new Migrator.
func NewMigrator(parameters *Parameters) *Migrator {
	return &Migrator{
		db:               parameters.DB,
		currentDBVersion: parameters.DatabaseVersion,
		currentEdition:   parameters.CurrentEdition,

		authorizationService: parameters.AuthorizationService,
		endpointGroupService: parameters.EndpointGroupService,
		endpointService:      parameters.EndpointService,
		extensionService:     parameters.ExtensionService,
		versionService:       parameters.VersionService,
	}
}

// Migrate checks the database version and migrate the existing data to the most recent data model.
func (m *Migrator) Migrate() error {

	return nil
}
