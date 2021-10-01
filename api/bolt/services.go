package bolt

import (
	"github.com/portainer/portainer/api/bolt/apikeyrepository"
	"github.com/portainer/portainer/api/bolt/customtemplate"
	"github.com/portainer/portainer/api/bolt/dockerhub"
	"github.com/portainer/portainer/api/bolt/edgegroup"
	"github.com/portainer/portainer/api/bolt/edgejob"
	"github.com/portainer/portainer/api/bolt/edgestack"
	"github.com/portainer/portainer/api/bolt/endpoint"
	"github.com/portainer/portainer/api/bolt/endpointgroup"
	"github.com/portainer/portainer/api/bolt/endpointrelation"
	"github.com/portainer/portainer/api/bolt/extension"
	"github.com/portainer/portainer/api/bolt/helmuserrepository"
	"github.com/portainer/portainer/api/bolt/registry"
	"github.com/portainer/portainer/api/bolt/resourcecontrol"
	"github.com/portainer/portainer/api/bolt/role"
	"github.com/portainer/portainer/api/bolt/schedule"
	"github.com/portainer/portainer/api/bolt/settings"
	"github.com/portainer/portainer/api/bolt/ssl"
	"github.com/portainer/portainer/api/bolt/stack"
	"github.com/portainer/portainer/api/bolt/tag"
	"github.com/portainer/portainer/api/bolt/team"
	"github.com/portainer/portainer/api/bolt/teammembership"
	"github.com/portainer/portainer/api/bolt/tunnelserver"
	"github.com/portainer/portainer/api/bolt/user"
	"github.com/portainer/portainer/api/bolt/version"
	"github.com/portainer/portainer/api/bolt/webhook"
	"github.com/portainer/portainer/api/datastore"
)

func (store *Store) initServices() error {
	authorizationsetService, err := role.NewService(store.connection)
	if err != nil {
		return err
	}
	store.RoleService = authorizationsetService

	customTemplateService, err := customtemplate.NewService(store.connection)
	if err != nil {
		return err
	}
	store.CustomTemplateService = customTemplateService

	dockerhubService, err := dockerhub.NewService(store.connection)
	if err != nil {
		return err
	}
	store.DockerHubService = dockerhubService

	edgeStackService, err := edgestack.NewService(store.connection)
	if err != nil {
		return err
	}
	store.EdgeStackService = edgeStackService

	edgeGroupService, err := edgegroup.NewService(store.connection)
	if err != nil {
		return err
	}
	store.EdgeGroupService = edgeGroupService

	edgeJobService, err := edgejob.NewService(store.connection)
	if err != nil {
		return err
	}
	store.EdgeJobService = edgeJobService

	endpointgroupService, err := endpointgroup.NewService(store.connection)
	if err != nil {
		return err
	}
	store.EndpointGroupService = endpointgroupService

	endpointService, err := endpoint.NewService(store.connection)
	if err != nil {
		return err
	}
	store.EndpointService = endpointService

	endpointRelationService, err := endpointrelation.NewService(store.connection)
	if err != nil {
		return err
	}
	store.EndpointRelationService = endpointRelationService

	extensionService, err := extension.NewService(store.connection)
	if err != nil {
		return err
	}
	store.ExtensionService = extensionService

	helmUserRepositoryService, err := helmuserrepository.NewService(store.connection)
	if err != nil {
		return err
	}
	store.HelmUserRepositoryService = helmUserRepositoryService

	registryService, err := registry.NewService(store.connection)
	if err != nil {
		return err
	}
	store.RegistryService = registryService

	resourcecontrolService, err := resourcecontrol.NewService(store.connection)
	if err != nil {
		return err
	}
	store.ResourceControlService = resourcecontrolService

	settingsService, err := settings.NewService(store.connection)
	if err != nil {
		return err
	}
	store.SettingsService = settingsService

	sslSettingsService, err := ssl.NewService(store.connection)
	if err != nil {
		return err
	}
	store.SSLSettingsService = sslSettingsService

	stackService, err := stack.NewService(store.connection)
	if err != nil {
		return err
	}
	store.StackService = stackService

	tagService, err := tag.NewService(store.connection)
	if err != nil {
		return err
	}
	store.TagService = tagService

	teammembershipService, err := teammembership.NewService(store.connection)
	if err != nil {
		return err
	}
	store.TeamMembershipService = teammembershipService

	teamService, err := team.NewService(store.connection)
	if err != nil {
		return err
	}
	store.TeamService = teamService

	tunnelServerService, err := tunnelserver.NewService(store.connection)
	if err != nil {
		return err
	}
	store.TunnelServerService = tunnelServerService

	userService, err := user.NewService(store.connection)
	if err != nil {
		return err
	}
	store.UserService = userService

	apiKeyService, err := apikeyrepository.NewService(store.connection)
	if err != nil {
		return err
	}
	store.APIKeyRepositoryService = apiKeyService

	versionService, err := version.NewService(store.connection)
	if err != nil {
		return err
	}
	store.VersionService = versionService

	webhookService, err := webhook.NewService(store.connection)
	if err != nil {
		return err
	}
	store.WebhookService = webhookService

	scheduleService, err := schedule.NewService(store.connection)
	if err != nil {
		return err
	}
	store.ScheduleService = scheduleService

	return nil
}

// CustomTemplate gives access to the CustomTemplate data management layer
func (store *Store) CustomTemplate() datastore.CustomTemplateService {
	return store.CustomTemplateService
}

// EdgeGroup gives access to the EdgeGroup data management layer
func (store *Store) EdgeGroup() datastore.EdgeGroupService {
	return store.EdgeGroupService
}

// EdgeJob gives access to the EdgeJob data management layer
func (store *Store) EdgeJob() datastore.EdgeJobService {
	return store.EdgeJobService
}

// EdgeStack gives access to the EdgeStack data management layer
func (store *Store) EdgeStack() datastore.EdgeStackService {
	return store.EdgeStackService
}

// Environment(Endpoint) gives access to the Environment(Endpoint) data management layer
func (store *Store) Endpoint() datastore.EndpointService {
	return store.EndpointService
}

// EndpointGroup gives access to the EndpointGroup data management layer
func (store *Store) EndpointGroup() datastore.EndpointGroupService {
	return store.EndpointGroupService
}

// EndpointRelation gives access to the EndpointRelation data management layer
func (store *Store) EndpointRelation() datastore.EndpointRelationService {
	return store.EndpointRelationService
}

// HelmUserRepository access the helm user repository settings
func (store *Store) HelmUserRepository() datastore.HelmUserRepositoryService {
	return store.HelmUserRepositoryService
}

// Registry gives access to the Registry data management layer
func (store *Store) Registry() datastore.RegistryService {
	return store.RegistryService
}

// ResourceControl gives access to the ResourceControl data management layer
func (store *Store) ResourceControl() datastore.ResourceControlService {
	return store.ResourceControlService
}

// Role gives access to the Role data management layer
func (store *Store) Role() datastore.RoleService {
	return store.RoleService
}

// APIKeyRepository gives access to the api-key data management layer
func (store *Store) APIKeyRepository() datastore.APIKeyRepository {
	return store.APIKeyRepositoryService
}

// Settings gives access to the Settings data management layer
func (store *Store) Settings() datastore.SettingsService {
	return store.SettingsService
}

// SSLSettings gives access to the SSL Settings data management layer
func (store *Store) SSLSettings() datastore.SSLSettingsService {
	return store.SSLSettingsService
}

// Stack gives access to the Stack data management layer
func (store *Store) Stack() datastore.StackService {
	return store.StackService
}

// Tag gives access to the Tag data management layer
func (store *Store) Tag() datastore.TagService {
	return store.TagService
}

// TeamMembership gives access to the TeamMembership data management layer
func (store *Store) TeamMembership() datastore.TeamMembershipService {
	return store.TeamMembershipService
}

// Team gives access to the Team data management layer
func (store *Store) Team() datastore.TeamService {
	return store.TeamService
}

// TunnelServer gives access to the TunnelServer data management layer
func (store *Store) TunnelServer() datastore.TunnelServerService {
	return store.TunnelServerService
}

// User gives access to the User data management layer
func (store *Store) User() datastore.UserService {
	return store.UserService
}

// Version gives access to the Version data management layer
func (store *Store) Version() datastore.VersionService {
	return store.VersionService
}

// Webhook gives access to the Webhook data management layer
func (store *Store) Webhook() datastore.WebhookService {
	return store.WebhookService
}
