package database

import (
	"io/ioutil"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/customtemplate"
	"github.com/portainer/portainer/api/dataservices/dockerhub"
	"github.com/portainer/portainer/api/dataservices/edgegroup"
	"github.com/portainer/portainer/api/dataservices/edgejob"
	"github.com/portainer/portainer/api/dataservices/edgestack"
	"github.com/portainer/portainer/api/dataservices/endpoint"
	"github.com/portainer/portainer/api/dataservices/endpointgroup"
	"github.com/portainer/portainer/api/dataservices/endpointrelation"
	"github.com/portainer/portainer/api/dataservices/extension"
	"github.com/portainer/portainer/api/dataservices/helmuserrepository"
	"github.com/portainer/portainer/api/dataservices/registry"
	"github.com/portainer/portainer/api/dataservices/resourcecontrol"
	"github.com/portainer/portainer/api/dataservices/role"
	"github.com/portainer/portainer/api/dataservices/schedule"
	"github.com/portainer/portainer/api/dataservices/settings"
	"github.com/portainer/portainer/api/dataservices/ssl"
	"github.com/portainer/portainer/api/dataservices/stack"
	"github.com/portainer/portainer/api/dataservices/tag"
	"github.com/portainer/portainer/api/dataservices/team"
	"github.com/portainer/portainer/api/dataservices/teammembership"
	"github.com/portainer/portainer/api/dataservices/tunnelserver"
	"github.com/portainer/portainer/api/dataservices/user"
	"github.com/portainer/portainer/api/dataservices/version"
	"github.com/portainer/portainer/api/dataservices/webhook"
	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
)

// Store defines the implementation of portainer.DataStore using
// BoltDB as the storage system.
type Store struct {
	connection portainer.Connection
	isNew      bool

	fileService               portainer.FileService
	CustomTemplateService     *customtemplate.Service
	DockerHubService          *dockerhub.Service
	EdgeGroupService          *edgegroup.Service
	EdgeJobService            *edgejob.Service
	EdgeStackService          *edgestack.Service
	EndpointGroupService      *endpointgroup.Service
	EndpointService           *endpoint.Service
	EndpointRelationService   *endpointrelation.Service
	ExtensionService          *extension.Service
	HelmUserRepositoryService *helmuserrepository.Service
	RegistryService           *registry.Service
	ResourceControlService    *resourcecontrol.Service
	RoleService               *role.Service
	ScheduleService           *schedule.Service
	SettingsService           *settings.Service
	SSLSettingsService        *ssl.Service
	StackService              *stack.Service
	TagService                *tag.Service
	TeamMembershipService     *teammembership.Service
	TeamService               *team.Service
	TunnelServerService       *tunnelserver.Service
	UserService               *user.Service
	VersionService            *version.Service
	WebhookService            *webhook.Service
}

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
func (store *Store) CustomTemplate() dataservices.CustomTemplateService {
	return store.CustomTemplateService
}

// EdgeGroup gives access to the EdgeGroup data management layer
func (store *Store) EdgeGroup() dataservices.EdgeGroupService {
	return store.EdgeGroupService
}

// EdgeJob gives access to the EdgeJob data management layer
func (store *Store) EdgeJob() dataservices.EdgeJobService {
	return store.EdgeJobService
}

// EdgeStack gives access to the EdgeStack data management layer
func (store *Store) EdgeStack() dataservices.EdgeStackService {
	return store.EdgeStackService
}

// Environment(Endpoint) gives access to the Environment(Endpoint) data management layer
func (store *Store) Endpoint() dataservices.EndpointService {
	return store.EndpointService
}

// EndpointGroup gives access to the EndpointGroup data management layer
func (store *Store) EndpointGroup() dataservices.EndpointGroupService {
	return store.EndpointGroupService
}

// EndpointRelation gives access to the EndpointRelation data management layer
func (store *Store) EndpointRelation() dataservices.EndpointRelationService {
	return store.EndpointRelationService
}

// HelmUserRepository access the helm user repository settings
func (store *Store) HelmUserRepository() dataservices.HelmUserRepositoryService {
	return store.HelmUserRepositoryService
}

// Registry gives access to the Registry data management layer
func (store *Store) Registry() dataservices.RegistryService {
	return store.RegistryService
}

// ResourceControl gives access to the ResourceControl data management layer
func (store *Store) ResourceControl() dataservices.ResourceControlService {
	return store.ResourceControlService
}

// Role gives access to the Role data management layer
func (store *Store) Role() dataservices.RoleService {
	return store.RoleService
}

// Settings gives access to the Settings data management layer
func (store *Store) Settings() dataservices.SettingsService {
	return store.SettingsService
}

// SSLSettings gives access to the SSL Settings data management layer
func (store *Store) SSLSettings() dataservices.SSLSettingsService {
	return store.SSLSettingsService
}

// Stack gives access to the Stack data management layer
func (store *Store) Stack() dataservices.StackService {
	return store.StackService
}

// Tag gives access to the Tag data management layer
func (store *Store) Tag() dataservices.TagService {
	return store.TagService
}

// TeamMembership gives access to the TeamMembership data management layer
func (store *Store) TeamMembership() dataservices.TeamMembershipService {
	return store.TeamMembershipService
}

// Team gives access to the Team data management layer
func (store *Store) Team() dataservices.TeamService {
	return store.TeamService
}

// TunnelServer gives access to the TunnelServer data management layer
func (store *Store) TunnelServer() dataservices.TunnelServerService {
	return store.TunnelServerService
}

// User gives access to the User data management layer
func (store *Store) User() dataservices.UserService {
	return store.UserService
}

// Version gives access to the Version data management layer
func (store *Store) Version() dataservices.VersionService {
	return store.VersionService
}

// Webhook gives access to the Webhook data management layer
func (store *Store) Webhook() dataservices.WebhookService {
	return store.WebhookService
}

func (store *Store) Export(filename string) (err error) {
	backup := make(map[string]interface{})

	backup[store.CustomTemplate().BucketName()], err = store.CustomTemplate().CustomTemplates()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.EdgeGroup().BucketName()], err = store.EdgeGroup().EdgeGroups()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.EdgeJob().BucketName()], err = store.EdgeJob().EdgeJobs()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.EdgeStack().BucketName()], err = store.EdgeStack().EdgeStacks()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.Endpoint().BucketName()], err = store.Endpoint().Endpoints()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.EndpointGroup().BucketName()], err = store.EndpointGroup().EndpointGroups()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.EndpointRelation().BucketName()], err = store.EndpointRelation().EndpointRelations()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.HelmUserRepository().BucketName()], err = store.HelmUserRepository().HelmUserRepositorys()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.Registry().BucketName()], err = store.Registry().Registries()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.ResourceControl().BucketName()], err = store.ResourceControl().ResourceControls()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.Role().BucketName()], err = store.Role().Roles()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.Settings().BucketName()], err = store.Settings().Settings()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.SSLSettings().BucketName()], err = store.SSLSettings().Settings()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.Stack().BucketName()], err = store.Stack().Stacks()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.Tag().BucketName()], err = store.Tag().Tags()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.TeamMembership().BucketName()], err = store.TeamMembership().TeamMemberships()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.Team().BucketName()], err = store.Team().Teams()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.TunnelServer().BucketName()], err = store.TunnelServer().Info()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.User().BucketName()], err = store.User().Users()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	v, _ := store.Version().DBVersion()
	instance, _ := store.Version().InstanceID()
	//edition, _ := store.Version().Edition()
	backup[store.Version().BucketName()] = map[string]string{
		"DB_VERSION":  strconv.Itoa(v),
		"INSTANCE_ID": instance,
	}
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	backup[store.Webhook().BucketName()], err = store.Webhook().Webhooks()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}

	b, err := yaml.Marshal(backup)
	if err != nil {
		return err
	}
	return ioutil.WriteFile(filename, b, 0600)
}
