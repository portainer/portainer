package migrator

import (
	"fmt"

	"github.com/boltdb/bolt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/endpoint"
	"github.com/portainer/portainer/api/bolt/endpointgroup"
	"github.com/portainer/portainer/api/bolt/endpointrelation"
	"github.com/portainer/portainer/api/bolt/extension"
	plog "github.com/portainer/portainer/api/bolt/log"
	"github.com/portainer/portainer/api/bolt/registry"
	"github.com/portainer/portainer/api/bolt/resourcecontrol"
	"github.com/portainer/portainer/api/bolt/role"
	"github.com/portainer/portainer/api/bolt/schedule"
	"github.com/portainer/portainer/api/bolt/settings"
	"github.com/portainer/portainer/api/bolt/stack"
	"github.com/portainer/portainer/api/bolt/tag"
	"github.com/portainer/portainer/api/bolt/teammembership"
	"github.com/portainer/portainer/api/bolt/user"
	"github.com/portainer/portainer/api/bolt/version"
	"github.com/portainer/portainer/api/internal/authorization"
)

var migrateLog = plog.NewScopedLog("bolt, migrate")

type (
	// Migrator defines a service to migrate data after a Portainer version update.
	Migrator struct {
		db               *bolt.DB
		currentDBVersion int
		currentEdition   portainer.SoftwareEdition

		endpointGroupService    *endpointgroup.Service
		endpointService         *endpoint.Service
		endpointRelationService *endpointrelation.Service
		extensionService        *extension.Service
		registryService         *registry.Service
		resourceControlService  *resourcecontrol.Service
		roleService             *role.Service
		scheduleService         *schedule.Service
		settingsService         *settings.Service
		stackService            *stack.Service
		tagService              *tag.Service
		teamMembershipService   *teammembership.Service
		userService             *user.Service
		versionService          *version.Service
		fileService             portainer.FileService
		authorizationService    *authorization.Service
	}

	// Parameters represents the required parameters to create a new Migrator instance.
	Parameters struct {
		DB              *bolt.DB
		DatabaseVersion int
		CurrentEdition  portainer.SoftwareEdition

		EndpointGroupService    *endpointgroup.Service
		EndpointService         *endpoint.Service
		EndpointRelationService *endpointrelation.Service
		ExtensionService        *extension.Service
		RegistryService         *registry.Service
		ResourceControlService  *resourcecontrol.Service
		RoleService             *role.Service
		ScheduleService         *schedule.Service
		SettingsService         *settings.Service
		StackService            *stack.Service
		TagService              *tag.Service
		TeamMembershipService   *teammembership.Service
		UserService             *user.Service
		VersionService          *version.Service
		FileService             portainer.FileService
		AuthorizationService    *authorization.Service
	}
)

// NewMigrator creates a new Migrator.
func NewMigrator(parameters *Parameters) *Migrator {
	return &Migrator{
		db:                      parameters.DB,
		currentDBVersion:        parameters.DatabaseVersion,
		currentEdition:          parameters.CurrentEdition,
		endpointGroupService:    parameters.EndpointGroupService,
		endpointService:         parameters.EndpointService,
		endpointRelationService: parameters.EndpointRelationService,
		extensionService:        parameters.ExtensionService,
		registryService:         parameters.RegistryService,
		resourceControlService:  parameters.ResourceControlService,
		roleService:             parameters.RoleService,
		scheduleService:         parameters.ScheduleService,
		settingsService:         parameters.SettingsService,
		tagService:              parameters.TagService,
		teamMembershipService:   parameters.TeamMembershipService,
		stackService:            parameters.StackService,
		userService:             parameters.UserService,
		versionService:          parameters.VersionService,
		fileService:             parameters.FileService,
		authorizationService:    parameters.AuthorizationService,
	}
}

// Version exposes version of database
func (migrator *Migrator) Version() int {
	return migrator.currentDBVersion
}

// Edition exposes edition of portainer
func (migrator *Migrator) Edition() portainer.SoftwareEdition {
	return migrator.currentEdition
}

// Migrate helper to upgrade DB
func (migrator *Migrator) Migrate(version int) error {

	migrateLog.Info(fmt.Sprintf("Migrating %s database from version %d to %d.", migrator.Edition().GetEditionLabel(), migrator.currentDBVersion, version))
	// TODO : run backup before migration and restore if failed
	err := migrator.MigrateCE() //CE
	if err != nil {
		migrateLog.Error("An error occurred during database migration", err)
		return err
	}

	migrator.versionService.StoreDBVersion(version)
	migrator.currentDBVersion = version

	return nil
}

// RollbackVersion rolls back the db to version
func (migrator *Migrator) RollbackVersion(version int) error {

	err := migrator.versionService.StoreDBVersion(version) // portainer.DBVersion
	return err
}

// RollbackEdition rolls back the db to portainer CE
func (migrator *Migrator) RollbackEdition(edition portainer.SoftwareEdition) error {

	err := migrator.versionService.StoreEdition(portainer.PortainerCE)
	return err
}
