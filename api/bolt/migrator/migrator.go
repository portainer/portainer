package migrator

import (
	"github.com/boltdb/bolt"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/endpoint"
	"github.com/portainer/portainer/bolt/endpointgroup"
	"github.com/portainer/portainer/bolt/resourcecontrol"
	"github.com/portainer/portainer/bolt/settings"
	"github.com/portainer/portainer/bolt/stack"
	"github.com/portainer/portainer/bolt/user"
	"github.com/portainer/portainer/bolt/version"
)

type (
	// Migrator defines a service to migrate data after a Portainer version update.
	Migrator struct {
		currentDBVersion       int
		db                     *bolt.DB
		endpointGroupService   *endpointgroup.Service
		endpointService        *endpoint.Service
		resourceControlService *resourcecontrol.Service
		settingsService        *settings.Service
		stackService           *stack.Service
		userService            *user.Service
		versionService         *version.Service
		fileService            portainer.FileService
	}

	// Parameters represents the required parameters to create a new Migrator instance.
	Parameters struct {
		DB                     *bolt.DB
		DatabaseVersion        int
		EndpointGroupService   *endpointgroup.Service
		EndpointService        *endpoint.Service
		ResourceControlService *resourcecontrol.Service
		SettingsService        *settings.Service
		StackService           *stack.Service
		UserService            *user.Service
		VersionService         *version.Service
		FileService            portainer.FileService
	}
)

// NewMigrator creates a new Migrator.
func NewMigrator(parameters *Parameters) *Migrator {
	return &Migrator{
		db:                     parameters.DB,
		currentDBVersion:       parameters.DatabaseVersion,
		endpointGroupService:   parameters.EndpointGroupService,
		endpointService:        parameters.EndpointService,
		resourceControlService: parameters.ResourceControlService,
		settingsService:        parameters.SettingsService,
		stackService:           parameters.StackService,
		userService:            parameters.UserService,
		versionService:         parameters.VersionService,
		fileService:            parameters.FileService,
	}
}

// Migrate checks the database version and migrate the existing data to the most recent data model.
func (m *Migrator) Migrate() error {

	// Portainer < 1.12
	if m.currentDBVersion < 1 {
		err := m.updateAdminUserToDBVersion1()
		if err != nil {
			return err
		}
	}

	// Portainer 1.12.x
	if m.currentDBVersion < 2 {
		err := m.updateResourceControlsToDBVersion2()
		if err != nil {
			return err
		}
		err = m.updateEndpointsToDBVersion2()
		if err != nil {
			return err
		}
	}

	// Portainer 1.13.x
	if m.currentDBVersion < 3 {
		err := m.updateSettingsToDBVersion3()
		if err != nil {
			return err
		}
	}

	// Portainer 1.14.0
	if m.currentDBVersion < 4 {
		err := m.updateEndpointsToDBVersion4()
		if err != nil {
			return err
		}
	}

	// https://github.com/portainer/portainer/issues/1235
	if m.currentDBVersion < 5 {
		err := m.updateSettingsToVersion5()
		if err != nil {
			return err
		}
	}

	// https://github.com/portainer/portainer/issues/1236
	if m.currentDBVersion < 6 {
		err := m.updateSettingsToVersion6()
		if err != nil {
			return err
		}
	}

	// https://github.com/portainer/portainer/issues/1449
	if m.currentDBVersion < 7 {
		err := m.updateSettingsToVersion7()
		if err != nil {
			return err
		}
	}

	if m.currentDBVersion < 8 {
		err := m.updateEndpointsToVersion8()
		if err != nil {
			return err
		}
	}

	// https: //github.com/portainer/portainer/issues/1396
	if m.currentDBVersion < 9 {
		err := m.updateEndpointsToVersion9()
		if err != nil {
			return err
		}
	}

	// https://github.com/portainer/portainer/issues/461
	if m.currentDBVersion < 10 {
		err := m.updateEndpointsToVersion10()
		if err != nil {
			return err
		}
	}

	// https://github.com/portainer/portainer/issues/1906
	if m.currentDBVersion < 11 {
		err := m.updateEndpointsToVersion11()
		if err != nil {
			return err
		}
	}

	// Portainer 1.18.0
	if m.currentDBVersion < 12 {
		err := m.updateEndpointsToVersion12()
		if err != nil {
			return err
		}

		err = m.updateEndpointGroupsToVersion12()
		if err != nil {
			return err
		}

		err = m.updateStacksToVersion12()
		if err != nil {
			return err
		}
	}

	// Portainer 1.18.2-dev
	if m.currentDBVersion < 13 {
		err := m.updateSettingsToVersion13()
		if err != nil {
			return err
		}
	}

	return m.versionService.StoreDBVersion(portainer.DBVersion)
}
