package migrator

import (
	"errors"

	"github.com/Masterminds/semver"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/models"
	"github.com/portainer/portainer/api/dataservices/dockerhub"
	"github.com/portainer/portainer/api/dataservices/edgejob"
	"github.com/portainer/portainer/api/dataservices/edgestack"
	"github.com/portainer/portainer/api/dataservices/endpoint"
	"github.com/portainer/portainer/api/dataservices/endpointgroup"
	"github.com/portainer/portainer/api/dataservices/endpointrelation"
	"github.com/portainer/portainer/api/dataservices/extension"
	"github.com/portainer/portainer/api/dataservices/fdoprofile"
	"github.com/portainer/portainer/api/dataservices/registry"
	"github.com/portainer/portainer/api/dataservices/resourcecontrol"
	"github.com/portainer/portainer/api/dataservices/role"
	"github.com/portainer/portainer/api/dataservices/schedule"
	"github.com/portainer/portainer/api/dataservices/settings"
	"github.com/portainer/portainer/api/dataservices/snapshot"
	"github.com/portainer/portainer/api/dataservices/stack"
	"github.com/portainer/portainer/api/dataservices/tag"
	"github.com/portainer/portainer/api/dataservices/teammembership"
	"github.com/portainer/portainer/api/dataservices/tunnelserver"
	"github.com/portainer/portainer/api/dataservices/user"
	"github.com/portainer/portainer/api/dataservices/version"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/rs/zerolog/log"
)

type (
	// Migrator defines a service to migrate data after a Portainer version update.
	Migrator struct {
		currentDBVersion *models.Version
		migrations       []Migrations

		endpointGroupService    *endpointgroup.Service
		endpointService         *endpoint.Service
		endpointRelationService *endpointrelation.Service
		extensionService        *extension.Service
		fdoProfilesService      *fdoprofile.Service
		registryService         *registry.Service
		resourceControlService  *resourcecontrol.Service
		roleService             *role.Service
		scheduleService         *schedule.Service
		settingsService         *settings.Service
		snapshotService         *snapshot.Service
		stackService            *stack.Service
		tagService              *tag.Service
		teamMembershipService   *teammembership.Service
		userService             *user.Service
		versionService          *version.Service
		fileService             portainer.FileService
		authorizationService    *authorization.Service
		dockerhubService        *dockerhub.Service
		edgeStackService        *edgestack.Service
		edgeJobService          *edgejob.Service
		TunnelServerService     *tunnelserver.Service
	}

	// MigratorParameters represents the required parameters to create a new Migrator instance.
	MigratorParameters struct {
		CurrentDBVersion        *models.Version
		EndpointGroupService    *endpointgroup.Service
		EndpointService         *endpoint.Service
		EndpointRelationService *endpointrelation.Service
		ExtensionService        *extension.Service
		FDOProfilesService      *fdoprofile.Service
		RegistryService         *registry.Service
		ResourceControlService  *resourcecontrol.Service
		RoleService             *role.Service
		ScheduleService         *schedule.Service
		SettingsService         *settings.Service
		SnapshotService         *snapshot.Service
		StackService            *stack.Service
		TagService              *tag.Service
		TeamMembershipService   *teammembership.Service
		UserService             *user.Service
		VersionService          *version.Service
		FileService             portainer.FileService
		AuthorizationService    *authorization.Service
		DockerhubService        *dockerhub.Service
		EdgeStackService        *edgestack.Service
		EdgeJobService          *edgejob.Service
		TunnelServerService     *tunnelserver.Service
	}
)

// NewMigrator creates a new Migrator.
func NewMigrator(parameters *MigratorParameters) *Migrator {
	migrator := &Migrator{
		currentDBVersion:        parameters.CurrentDBVersion,
		endpointGroupService:    parameters.EndpointGroupService,
		endpointService:         parameters.EndpointService,
		endpointRelationService: parameters.EndpointRelationService,
		extensionService:        parameters.ExtensionService,
		fdoProfilesService:      parameters.FDOProfilesService,
		registryService:         parameters.RegistryService,
		resourceControlService:  parameters.ResourceControlService,
		roleService:             parameters.RoleService,
		scheduleService:         parameters.ScheduleService,
		settingsService:         parameters.SettingsService,
		snapshotService:         parameters.SnapshotService,
		tagService:              parameters.TagService,
		teamMembershipService:   parameters.TeamMembershipService,
		stackService:            parameters.StackService,
		userService:             parameters.UserService,
		versionService:          parameters.VersionService,
		fileService:             parameters.FileService,
		authorizationService:    parameters.AuthorizationService,
		dockerhubService:        parameters.DockerhubService,
		edgeStackService:        parameters.EdgeStackService,
		edgeJobService:          parameters.EdgeJobService,
		TunnelServerService:     parameters.TunnelServerService,
	}

	migrator.initMigrations()
	return migrator
}

func (m *Migrator) CurrentDBVersion() string {
	return m.currentDBVersion.SchemaVersion
}

func (m *Migrator) CurrentDBEdition() portainer.SoftwareEdition {
	return portainer.SoftwareEdition(m.currentDBVersion.Edition)
}

func (m *Migrator) CurrentSemanticDBVersion() *semver.Version {
	v, err := semver.NewVersion(m.currentDBVersion.SchemaVersion)
	if err != nil {
		log.Fatal().Stack().Err(err).Msg("failed to parse current version")
	}

	return v
}

func (m *Migrator) addMigrations(v string, funcs ...func() error) {
	m.migrations = append(m.migrations, Migrations{
		Version:        semver.MustParse(v),
		MigrationFuncs: funcs,
	})
}

func (m *Migrator) LatestMigrations() Migrations {
	return m.migrations[len(m.migrations)-1]
}

func (m *Migrator) GetMigratorCountOfCurrentAPIVersion() int {
	migratorCount := 0
	latestMigrations := m.LatestMigrations()

	if latestMigrations.Version.Equal(semver.MustParse(portainer.APIVersion)) {
		migratorCount = len(latestMigrations.MigrationFuncs)
	}

	return migratorCount
}

// !NOTE: Migration funtions should ideally be idempotent.
// !      Which simply means the function can run over the same data many times but only transform it once.
// !      In practice this really just means an extra check or two to ensure we're not destroying valid data.
// !      This is not a hard rule though.  Understand the limitations.  A migration function may only run over
// !      the data more than once if a new migration function is added and the version of your database schema is
// !      the same.  e.g. two developers working on the same version add two different functions for different things.
// !      This increases the migration funcs count and so they all run again.

type Migrations struct {
	Version        *semver.Version
	MigrationFuncs MigrationFuncs
}

type MigrationFuncs []func() error

func (m *Migrator) initMigrations() {
	// !IMPORTANT: Do not be tempted to alter the order of these migrations.
	// !           Even though one of them looks out of order. Caused by history related
	// !           to maintaining two versions and releasing at different times

	m.addMigrations("1.0.0", dbTooOldError) // default version found after migration

	m.addMigrations("1.21",
		m.updateUsersToDBVersion18,
		m.updateEndpointsToDBVersion18,
		m.updateEndpointGroupsToDBVersion18,
		m.updateRegistriesToDBVersion18)

	m.addMigrations("1.22", m.updateSettingsToDBVersion19)

	m.addMigrations("1.22.1",
		m.updateUsersToDBVersion20,
		m.updateSettingsToDBVersion20,
		m.updateSchedulesToDBVersion20)

	m.addMigrations("1.23",
		m.updateResourceControlsToDBVersion22,
		m.updateUsersAndRolesToDBVersion22)

	m.addMigrations("1.24",
		m.updateTagsToDBVersion23,
		m.updateEndpointsAndEndpointGroupsToDBVersion23)

	m.addMigrations("1.24.1", m.updateSettingsToDB24)

	m.addMigrations("2.0",
		m.updateSettingsToDB25,
		m.updateStacksToDB24)

	m.addMigrations("2.1", m.updateEndpointSettingsToDB25)
	m.addMigrations("2.2", m.updateStackResourceControlToDB27)
	m.addMigrations("2.6", m.migrateDBVersionToDB30)
	m.addMigrations("2.9", m.migrateDBVersionToDB32)
	m.addMigrations("2.9.2", m.migrateDBVersionToDB33)
	m.addMigrations("2.10.0", m.migrateDBVersionToDB34)
	m.addMigrations("2.9.3", m.migrateDBVersionToDB35)
	m.addMigrations("2.12", m.migrateDBVersionToDB36)
	m.addMigrations("2.13", m.migrateDBVersionToDB40)
	m.addMigrations("2.14", m.migrateDBVersionToDB50)
	m.addMigrations("2.15", m.migrateDBVersionToDB60)
	m.addMigrations("2.16", m.migrateDBVersionToDB70)
	m.addMigrations("2.16.1", m.migrateDBVersionToDB71)
	m.addMigrations("2.17", m.migrateDBVersionToDB80)
	m.addMigrations("2.18", m.migrateDBVersionToDB90)
	m.addMigrations("2.19",
		m.convertSeedToPrivateKeyForDB100,
		m.migrateDockerDesktopExtentionSetting,
		m.updateEdgeStackStatusForDB100,
	)

	// Add new migrations below...
	// One function per migration, each versions migration funcs in the same file.
}

// Always is always run at the end of migrations
func (m *Migrator) Always() error {
	// currently nothing to be done in CE... yet
	return nil
}

func dbTooOldError() error {
	return errors.New("migrating from less than Portainer 1.21.0 is not supported, please contact Portainer support")
}
