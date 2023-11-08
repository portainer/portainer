package dataservices

import (
	"io"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/models"
)

type (
	DataStoreTx interface {
		IsErrObjectNotFound(err error) bool
		CustomTemplate() CustomTemplateService
		EdgeGroup() EdgeGroupService
		EdgeJob() EdgeJobService
		EdgeStack() EdgeStackService
		Endpoint() EndpointService
		EndpointGroup() EndpointGroupService
		EndpointRelation() EndpointRelationService
		FDOProfile() FDOProfileService
		HelmUserRepository() HelmUserRepositoryService
		Registry() RegistryService
		ResourceControl() ResourceControlService
		Role() RoleService
		APIKeyRepository() APIKeyRepository
		Settings() SettingsService
		Snapshot() SnapshotService
		SSLSettings() SSLSettingsService
		Stack() StackService
		Tag() TagService
		TeamMembership() TeamMembershipService
		Team() TeamService
		TunnelServer() TunnelServerService
		User() UserService
		Version() VersionService
		Webhook() WebhookService
	}

	DataStore interface {
		Open() (newStore bool, err error)
		Init() error
		Close() error
		UpdateTx(func(DataStoreTx) error) error
		ViewTx(func(DataStoreTx) error) error
		MigrateData() error
		Rollback(force bool) error
		CheckCurrentEdition() error
		BackupTo(w io.Writer) error
		Export(filename string) (err error)

		DataStoreTx
	}

	// CustomTemplateService represents a service to manage custom templates
	CustomTemplateService interface {
		BaseCRUD[portainer.CustomTemplate, portainer.CustomTemplateID]
		GetNextIdentifier() int
	}

	// EdgeGroupService represents a service to manage Edge groups
	EdgeGroupService interface {
		BaseCRUD[portainer.EdgeGroup, portainer.EdgeGroupID]
		UpdateEdgeGroupFunc(ID portainer.EdgeGroupID, updateFunc func(group *portainer.EdgeGroup)) error
	}

	// EdgeJobService represents a service to manage Edge jobs
	EdgeJobService interface {
		BaseCRUD[portainer.EdgeJob, portainer.EdgeJobID]
		CreateWithID(ID portainer.EdgeJobID, edgeJob *portainer.EdgeJob) error
		UpdateEdgeJobFunc(ID portainer.EdgeJobID, updateFunc func(edgeJob *portainer.EdgeJob)) error
		GetNextIdentifier() int
	}

	// EdgeStackService represents a service to manage Edge stacks
	EdgeStackService interface {
		EdgeStacks() ([]portainer.EdgeStack, error)
		EdgeStack(ID portainer.EdgeStackID) (*portainer.EdgeStack, error)
		EdgeStackVersion(ID portainer.EdgeStackID) (int, bool)
		Create(id portainer.EdgeStackID, edgeStack *portainer.EdgeStack) error
		UpdateEdgeStack(ID portainer.EdgeStackID, edgeStack *portainer.EdgeStack) error
		UpdateEdgeStackFunc(ID portainer.EdgeStackID, updateFunc func(edgeStack *portainer.EdgeStack)) error
		DeleteEdgeStack(ID portainer.EdgeStackID) error
		GetNextIdentifier() int
		BucketName() string
	}

	// EndpointService represents a service for managing environment(endpoint) data
	EndpointService interface {
		Endpoint(ID portainer.EndpointID) (*portainer.Endpoint, error)
		EndpointIDByEdgeID(edgeID string) (portainer.EndpointID, bool)
		EndpointsByTeamID(teamID portainer.TeamID) ([]portainer.Endpoint, error)
		Heartbeat(endpointID portainer.EndpointID) (int64, bool)
		UpdateHeartbeat(endpointID portainer.EndpointID)
		Endpoints() ([]portainer.Endpoint, error)
		Create(endpoint *portainer.Endpoint) error
		UpdateEndpoint(ID portainer.EndpointID, endpoint *portainer.Endpoint) error
		DeleteEndpoint(ID portainer.EndpointID) error
		GetNextIdentifier() int
		BucketName() string
	}

	// EndpointGroupService represents a service for managing environment(endpoint) group data
	EndpointGroupService interface {
		BaseCRUD[portainer.EndpointGroup, portainer.EndpointGroupID]
	}

	// EndpointRelationService represents a service for managing environment(endpoint) relations data
	EndpointRelationService interface {
		EndpointRelations() ([]portainer.EndpointRelation, error)
		EndpointRelation(EndpointID portainer.EndpointID) (*portainer.EndpointRelation, error)
		Create(endpointRelation *portainer.EndpointRelation) error
		UpdateEndpointRelation(EndpointID portainer.EndpointID, endpointRelation *portainer.EndpointRelation) error
		DeleteEndpointRelation(EndpointID portainer.EndpointID) error
		BucketName() string
	}

	// FDOProfileService represents a service to manage FDO Profiles
	FDOProfileService interface {
		BaseCRUD[portainer.FDOProfile, portainer.FDOProfileID]
		GetNextIdentifier() int
	}

	// HelmUserRepositoryService represents a service to manage HelmUserRepositories
	HelmUserRepositoryService interface {
		BaseCRUD[portainer.HelmUserRepository, portainer.HelmUserRepositoryID]
		HelmUserRepositoryByUserID(userID portainer.UserID) ([]portainer.HelmUserRepository, error)
	}

	// JWTService represents a service for managing JWT tokens
	JWTService interface {
		GenerateToken(data *portainer.TokenData) (string, error)
		GenerateTokenForOAuth(data *portainer.TokenData, expiryTime *time.Time) (string, error)
		GenerateTokenForKubeconfig(data *portainer.TokenData) (string, error)
		ParseAndVerifyToken(token string) (*portainer.TokenData, error)
		SetUserSessionDuration(userSessionDuration time.Duration)
	}

	// RegistryService represents a service for managing registry data
	RegistryService interface {
		BaseCRUD[portainer.Registry, portainer.RegistryID]
	}

	// ResourceControlService represents a service for managing resource control data
	ResourceControlService interface {
		BaseCRUD[portainer.ResourceControl, portainer.ResourceControlID]
		ResourceControlByResourceIDAndType(resourceID string, resourceType portainer.ResourceControlType) (*portainer.ResourceControl, error)
	}

	// RoleService represents a service for managing user roles
	RoleService interface {
		BaseCRUD[portainer.Role, portainer.RoleID]
	}

	// APIKeyRepositoryService
	APIKeyRepository interface {
		BaseCRUD[portainer.APIKey, portainer.APIKeyID]
		GetAPIKeysByUserID(userID portainer.UserID) ([]portainer.APIKey, error)
		GetAPIKeyByDigest(digest []byte) (*portainer.APIKey, error)
	}

	// SettingsService represents a service for managing application settings
	SettingsService interface {
		Settings() (*portainer.Settings, error)
		UpdateSettings(settings *portainer.Settings) error
		BucketName() string
	}

	SnapshotService interface {
		BaseCRUD[portainer.Snapshot, portainer.EndpointID]
	}

	// SSLSettingsService represents a service for managing application settings
	SSLSettingsService interface {
		Settings() (*portainer.SSLSettings, error)
		UpdateSettings(settings *portainer.SSLSettings) error
		BucketName() string
	}

	// StackService represents a service for managing stack data
	StackService interface {
		BaseCRUD[portainer.Stack, portainer.StackID]
		StackByName(name string) (*portainer.Stack, error)
		StacksByName(name string) ([]portainer.Stack, error)
		GetNextIdentifier() int
		StackByWebhookID(ID string) (*portainer.Stack, error)
		RefreshableStacks() ([]portainer.Stack, error)
	}

	// TagService represents a service for managing tag data
	TagService interface {
		BaseCRUD[portainer.Tag, portainer.TagID]
		UpdateTagFunc(ID portainer.TagID, updateFunc func(tag *portainer.Tag)) error
	}

	// TeamService represents a service for managing user data
	TeamService interface {
		BaseCRUD[portainer.Team, portainer.TeamID]
		TeamByName(name string) (*portainer.Team, error)
	}

	// TeamMembershipService represents a service for managing team membership data
	TeamMembershipService interface {
		BaseCRUD[portainer.TeamMembership, portainer.TeamMembershipID]
		TeamMembershipsByUserID(userID portainer.UserID) ([]portainer.TeamMembership, error)
		TeamMembershipsByTeamID(teamID portainer.TeamID) ([]portainer.TeamMembership, error)
		DeleteTeamMembershipByUserID(userID portainer.UserID) error
		DeleteTeamMembershipByTeamID(teamID portainer.TeamID) error
		DeleteTeamMembershipByTeamIDAndUserID(teamID portainer.TeamID, userID portainer.UserID) error
	}

	// TunnelServerService represents a service for managing data associated to the tunnel server
	TunnelServerService interface {
		Info() (*portainer.TunnelServerInfo, error)
		UpdateInfo(info *portainer.TunnelServerInfo) error
		BucketName() string
	}

	// UserService represents a service for managing user data
	UserService interface {
		BaseCRUD[portainer.User, portainer.UserID]
		UserByUsername(username string) (*portainer.User, error)
		UsersByRole(role portainer.UserRole) ([]portainer.User, error)
	}

	// VersionService represents a service for managing version data
	VersionService interface {
		InstanceID() (string, error)
		UpdateInstanceID(ID string) error
		Edition() (portainer.SoftwareEdition, error)
		Version() (*models.Version, error)
		UpdateVersion(*models.Version) error
	}

	// WebhookService represents a service for managing webhook data.
	WebhookService interface {
		BaseCRUD[portainer.Webhook, portainer.WebhookID]
		WebhookByResourceID(resourceID string) (*portainer.Webhook, error)
		WebhookByToken(token string) (*portainer.Webhook, error)
	}
)
