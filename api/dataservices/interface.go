package dataservices

// 	"github.com/portainer/portainer/api/dataservices"

import (
	"io"
	"time"

	"github.com/portainer/portainer/api/dataservices/errors"

	portainer "github.com/portainer/portainer/api"
)

type (
	// DataStore defines the interface to manage the data
	DataStore interface {
		Open() (newStore bool, err error)
		Init() error
		Close() error
		MigrateData() error
		Rollback(force bool) error
		CheckCurrentEdition() error
		BackupTo(w io.Writer) error
		Export(filename string) (err error)
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

	// CustomTemplateService represents a service to manage custom templates
	CustomTemplateService interface {
		GetNextIdentifier() int
		CustomTemplates() ([]portainer.CustomTemplate, error)
		CustomTemplate(ID portainer.CustomTemplateID) (*portainer.CustomTemplate, error)
		Create(customTemplate *portainer.CustomTemplate) error
		UpdateCustomTemplate(ID portainer.CustomTemplateID, customTemplate *portainer.CustomTemplate) error
		DeleteCustomTemplate(ID portainer.CustomTemplateID) error
		BucketName() string
	}

	// EdgeGroupService represents a service to manage Edge groups
	EdgeGroupService interface {
		EdgeGroups() ([]portainer.EdgeGroup, error)
		EdgeGroup(ID portainer.EdgeGroupID) (*portainer.EdgeGroup, error)
		Create(group *portainer.EdgeGroup) error
		UpdateEdgeGroup(ID portainer.EdgeGroupID, group *portainer.EdgeGroup) error
		DeleteEdgeGroup(ID portainer.EdgeGroupID) error
		BucketName() string
	}

	// EdgeJobService represents a service to manage Edge jobs
	EdgeJobService interface {
		EdgeJobs() ([]portainer.EdgeJob, error)
		EdgeJob(ID portainer.EdgeJobID) (*portainer.EdgeJob, error)
		Create(ID portainer.EdgeJobID, edgeJob *portainer.EdgeJob) error
		UpdateEdgeJob(ID portainer.EdgeJobID, edgeJob *portainer.EdgeJob) error
		DeleteEdgeJob(ID portainer.EdgeJobID) error
		GetNextIdentifier() int
		BucketName() string
	}

	// EdgeStackService represents a service to manage Edge stacks
	EdgeStackService interface {
		EdgeStacks() ([]portainer.EdgeStack, error)
		EdgeStack(ID portainer.EdgeStackID) (*portainer.EdgeStack, error)
		Create(id portainer.EdgeStackID, edgeStack *portainer.EdgeStack) error
		UpdateEdgeStack(ID portainer.EdgeStackID, edgeStack *portainer.EdgeStack) error
		DeleteEdgeStack(ID portainer.EdgeStackID) error
		GetNextIdentifier() int
		BucketName() string
	}

	// EndpointService represents a service for managing environment(endpoint) data
	EndpointService interface {
		Endpoint(ID portainer.EndpointID) (*portainer.Endpoint, error)
		Endpoints() ([]portainer.Endpoint, error)
		Create(endpoint *portainer.Endpoint) error
		UpdateEndpoint(ID portainer.EndpointID, endpoint *portainer.Endpoint) error
		DeleteEndpoint(ID portainer.EndpointID) error
		GetNextIdentifier() int
		BucketName() string
	}

	// EndpointGroupService represents a service for managing environment(endpoint) group data
	EndpointGroupService interface {
		EndpointGroup(ID portainer.EndpointGroupID) (*portainer.EndpointGroup, error)
		EndpointGroups() ([]portainer.EndpointGroup, error)
		Create(group *portainer.EndpointGroup) error
		UpdateEndpointGroup(ID portainer.EndpointGroupID, group *portainer.EndpointGroup) error
		DeleteEndpointGroup(ID portainer.EndpointGroupID) error
		BucketName() string
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
		FDOProfiles() ([]portainer.FDOProfile, error)
		FDOProfile(ID portainer.FDOProfileID) (*portainer.FDOProfile, error)
		Create(FDOProfile *portainer.FDOProfile) error
		Update(ID portainer.FDOProfileID, FDOProfile *portainer.FDOProfile) error
		Delete(ID portainer.FDOProfileID) error
		GetNextIdentifier() int
		BucketName() string
	}

	// HelmUserRepositoryService represents a service to manage HelmUserRepositories
	HelmUserRepositoryService interface {
		HelmUserRepositories() ([]portainer.HelmUserRepository, error)
		HelmUserRepositoryByUserID(userID portainer.UserID) ([]portainer.HelmUserRepository, error)
		Create(record *portainer.HelmUserRepository) error
		UpdateHelmUserRepository(ID portainer.HelmUserRepositoryID, repository *portainer.HelmUserRepository) error
		DeleteHelmUserRepository(ID portainer.HelmUserRepositoryID) error
		BucketName() string
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
		Registry(ID portainer.RegistryID) (*portainer.Registry, error)
		Registries() ([]portainer.Registry, error)
		Create(registry *portainer.Registry) error
		UpdateRegistry(ID portainer.RegistryID, registry *portainer.Registry) error
		DeleteRegistry(ID portainer.RegistryID) error
		BucketName() string
	}

	// ResourceControlService represents a service for managing resource control data
	ResourceControlService interface {
		ResourceControl(ID portainer.ResourceControlID) (*portainer.ResourceControl, error)
		ResourceControlByResourceIDAndType(resourceID string, resourceType portainer.ResourceControlType) (*portainer.ResourceControl, error)
		ResourceControls() ([]portainer.ResourceControl, error)
		Create(rc *portainer.ResourceControl) error
		UpdateResourceControl(ID portainer.ResourceControlID, resourceControl *portainer.ResourceControl) error
		DeleteResourceControl(ID portainer.ResourceControlID) error
		BucketName() string
	}

	// RoleService represents a service for managing user roles
	RoleService interface {
		Role(ID portainer.RoleID) (*portainer.Role, error)
		Roles() ([]portainer.Role, error)
		Create(role *portainer.Role) error
		UpdateRole(ID portainer.RoleID, role *portainer.Role) error
		BucketName() string
	}

	// APIKeyRepositoryService
	APIKeyRepository interface {
		CreateAPIKey(key *portainer.APIKey) error
		GetAPIKey(keyID portainer.APIKeyID) (*portainer.APIKey, error)
		UpdateAPIKey(key *portainer.APIKey) error
		DeleteAPIKey(ID portainer.APIKeyID) error
		GetAPIKeysByUserID(userID portainer.UserID) ([]portainer.APIKey, error)
		GetAPIKeyByDigest(digest []byte) (*portainer.APIKey, error)
	}

	// SettingsService represents a service for managing application settings
	SettingsService interface {
		Settings() (*portainer.Settings, error)
		UpdateSettings(settings *portainer.Settings) error
		IsFeatureFlagEnabled(feature portainer.Feature) bool
		BucketName() string
	}

	// SSLSettingsService represents a service for managing application settings
	SSLSettingsService interface {
		Settings() (*portainer.SSLSettings, error)
		UpdateSettings(settings *portainer.SSLSettings) error
		BucketName() string
	}

	// StackService represents a service for managing stack data
	StackService interface {
		Stack(ID portainer.StackID) (*portainer.Stack, error)
		StackByName(name string) (*portainer.Stack, error)
		StacksByName(name string) ([]portainer.Stack, error)
		Stacks() ([]portainer.Stack, error)
		Create(stack *portainer.Stack) error
		UpdateStack(ID portainer.StackID, stack *portainer.Stack) error
		DeleteStack(ID portainer.StackID) error
		GetNextIdentifier() int
		StackByWebhookID(ID string) (*portainer.Stack, error)
		RefreshableStacks() ([]portainer.Stack, error)
		BucketName() string
	}

	// TagService represents a service for managing tag data
	TagService interface {
		Tags() ([]portainer.Tag, error)
		Tag(ID portainer.TagID) (*portainer.Tag, error)
		Create(tag *portainer.Tag) error
		UpdateTag(ID portainer.TagID, tag *portainer.Tag) error
		DeleteTag(ID portainer.TagID) error
		BucketName() string
	}

	// TeamService represents a service for managing user data
	TeamService interface {
		Team(ID portainer.TeamID) (*portainer.Team, error)
		TeamByName(name string) (*portainer.Team, error)
		Teams() ([]portainer.Team, error)
		Create(team *portainer.Team) error
		UpdateTeam(ID portainer.TeamID, team *portainer.Team) error
		DeleteTeam(ID portainer.TeamID) error
		BucketName() string
	}

	// TeamMembershipService represents a service for managing team membership data
	TeamMembershipService interface {
		TeamMembership(ID portainer.TeamMembershipID) (*portainer.TeamMembership, error)
		TeamMemberships() ([]portainer.TeamMembership, error)
		TeamMembershipsByUserID(userID portainer.UserID) ([]portainer.TeamMembership, error)
		TeamMembershipsByTeamID(teamID portainer.TeamID) ([]portainer.TeamMembership, error)
		Create(membership *portainer.TeamMembership) error
		UpdateTeamMembership(ID portainer.TeamMembershipID, membership *portainer.TeamMembership) error
		DeleteTeamMembership(ID portainer.TeamMembershipID) error
		DeleteTeamMembershipByUserID(userID portainer.UserID) error
		DeleteTeamMembershipByTeamID(teamID portainer.TeamID) error
		BucketName() string
	}

	// TunnelServerService represents a service for managing data associated to the tunnel server
	TunnelServerService interface {
		Info() (*portainer.TunnelServerInfo, error)
		UpdateInfo(info *portainer.TunnelServerInfo) error
		BucketName() string
	}

	// UserService represents a service for managing user data
	UserService interface {
		User(ID portainer.UserID) (*portainer.User, error)
		UserByUsername(username string) (*portainer.User, error)
		Users() ([]portainer.User, error)
		UsersByRole(role portainer.UserRole) ([]portainer.User, error)
		Create(user *portainer.User) error
		UpdateUser(ID portainer.UserID, user *portainer.User) error
		DeleteUser(ID portainer.UserID) error
		BucketName() string
	}

	// VersionService represents a service for managing version data
	VersionService interface {
		DBVersion() (int, error)
		Edition() (portainer.SoftwareEdition, error)
		InstanceID() (string, error)
		StoreDBVersion(version int) error
		StoreInstanceID(ID string) error
		BucketName() string
	}

	// WebhookService represents a service for managing webhook data.
	WebhookService interface {
		Webhooks() ([]portainer.Webhook, error)
		Webhook(ID portainer.WebhookID) (*portainer.Webhook, error)
		Create(portainer *portainer.Webhook) error
		UpdateWebhook(ID portainer.WebhookID, webhook *portainer.Webhook) error
		WebhookByResourceID(resourceID string) (*portainer.Webhook, error)
		WebhookByToken(token string) (*portainer.Webhook, error)
		DeleteWebhook(ID portainer.WebhookID) error
		BucketName() string
	}
)

func IsErrObjectNotFound(e error) bool {
	return e == errors.ErrObjectNotFound
}
