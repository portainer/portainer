package migrator

import (
	"github.com/Masterminds/semver"
	"github.com/rs/zerolog/log"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/models"
	"github.com/portainer/portainer/api/dataservices/dockerhub"
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
	"github.com/portainer/portainer/api/dataservices/user"
	"github.com/portainer/portainer/api/dataservices/version"
	"github.com/portainer/portainer/api/internal/authorization"
)

type (
	// Migrator defines a service to migrate data after a Portainer version update.
	Migrator struct {
		currentVersion          *models.Version
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
	}

	// MigratorParameters represents the required parameters to create a new Migrator instance.
	MigratorParameters struct {
		CurrentVersion          *models.Version
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
	}
)

// NewMigrator creates a new Migrator.
func NewMigrator(parameters *MigratorParameters) *Migrator {
	return &Migrator{
		currentVersion:          parameters.CurrentVersion,
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
	}
}

func (m *Migrator) Version() string {
	return m.currentVersion.SchemaVersion
}

func (m *Migrator) Edition() portainer.SoftwareEdition {
	return portainer.SoftwareEdition(m.currentVersion.Edition)
}

func (m *Migrator) SemanticVersion() *semver.Version {
	v, err := semver.NewVersion(m.currentVersion.SchemaVersion)
	if err != nil {
		log.Fatal().Stack().Err(err).Msg("failed to parse current version")
	}

	return v
}
