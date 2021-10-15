package database

import (
	"encoding/json"
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

type storeExport struct {
	CustomTemplate     []portainer.CustomTemplate     `json:"customtemplates,omitempty"`
	EdgeGroup          []portainer.EdgeGroup          `json:"edgegroups,omitempty"`
	EdgeJob            []portainer.EdgeJob            `json:"edgejobs,omitempty"`
	EdgeStack          []portainer.EdgeStack          `json:"edge_stack,omitempty"`
	Endpoint           []portainer.Endpoint           `json:"endpoints,omitempty"`
	EndpointGroup      []portainer.EndpointGroup      `json:"endpoint_groups,omitempty"`
	EndpointRelation   []portainer.EndpointRelation   `json:"endpoint_relations,omitempty"`
	Extensions         []portainer.Extension          `json:"extension,omitempty"`
	HelmUserRepository []portainer.HelmUserRepository `json:"helm_user_repository,omitempty"`
	Registry           []portainer.Registry           `json:"registries,omitempty"`
	ResourceControl    []portainer.ResourceControl    `json:"resource_control,omitempty"`
	Role               []portainer.Role               `json:"roles,omitempty"`
	Schedules          []portainer.Schedule           `json:"schedules,omitempty"`
	Settings           portainer.Settings             `json:"customtemplates,omitempty"`
	SSLSettings        portainer.SSLSettings          `json:"ssl,omitempty"`
	Stack              []portainer.Stack              `json:"stacks,omitempty"`
	Tag                []portainer.Tag                `json:"tags,omitempty"`
	TeamMembership     []portainer.TeamMembership     `json:"team_membership,omitempty"`
	Team               []portainer.Team               `json:"teams,omitempty"`
	TunnelServer       portainer.TunnelServerInfo     `json:"tunnel_server,omitempty"`
	User               []portainer.User               `json:"users,omitempty"`
	Version            map[string]string              `json:"version,omitempty"`
	webhook            []portainer.Webhook            `json:"webhooks,omitempty"`
}

func (store *Store) Export(filename string) (err error) {

	backup := storeExport{}

	if c, err := store.CustomTemplate().CustomTemplates(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.CustomTemplate = c
	}
	if e, err := store.EdgeGroup().EdgeGroups(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.EdgeGroup = e
	}
	if e, err := store.EdgeJob().EdgeJobs(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.EdgeJob = e
	}
	if e, err := store.EdgeStack().EdgeStacks(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.EdgeStack = e
	}
	if e, err := store.Endpoint().Endpoints(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.Endpoint = e
	}
	if e, err := store.EndpointGroup().EndpointGroups(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.EndpointGroup = e
	}
	if r, err := store.EndpointRelation().EndpointRelations(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.EndpointRelation = r
	}
	if r, err := store.ExtensionService.Extensions(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.Extensions = r
	}
	if r, err := store.HelmUserRepository().HelmUserRepositorys(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.HelmUserRepository = r
	}
	if r, err := store.Registry().Registries(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.Registry = r
	}
	if c, err := store.ResourceControl().ResourceControls(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.ResourceControl = c
	}
	if role, err := store.Role().Roles(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.Role = role
	}
	if r, err := store.ScheduleService.Schedules(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.Schedules = r
	}
	if settings, err := store.Settings().Settings(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.Settings = *settings
	}
	if settings, err := store.SSLSettings().Settings(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.SSLSettings = *settings
	}
	if t, err := store.Stack().Stacks(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.Stack = t
	}
	if t, err := store.Tag().Tags(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.Tag = t
	}
	if t, err := store.TeamMembership().TeamMemberships(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.TeamMembership = t
	}
	if t, err := store.Team().Teams(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.Team = t
	}
	if info, err := store.TunnelServer().Info(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.TunnelServer = *info
	}
	if users, err := store.User().Users(); err != nil {
		logrus.WithError(err).Debugf("Export boom")
	} else {
		backup.User = users
	}
	v, err := store.Version().DBVersion()
	if err != nil {
		logrus.WithError(err).Debugf("Export boom")
	}
	instance, _ := store.Version().InstanceID()
	//edition, _ := store.Version().Edition()
	backup.Version = map[string]string{
		"DB_VERSION":  strconv.Itoa(v),
		"INSTANCE_ID": instance,
	}

	// backup[store.Webhook().BucketName()], err = store.Webhook().Webhooks()
	// if err != nil {
	// 	logrus.WithError(err).Debugf("Export boom")
	// }

	b, err := json.MarshalIndent(backup, "", "  ")
	if err != nil {
		return err
	}
	return ioutil.WriteFile(filename, b, 0600)
}

func (store *Store) Import(filename string) (err error) {
	backup := storeExport{}

	s, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}
	err = json.Unmarshal([]byte(s), &backup)
	if err != nil {
		return err
	}

	// TODO: yup, this is bad, and should be in a version struct...
	if dbversion, ok := backup.Version["DB_VERSION"]; ok {
		if v, err := strconv.Atoi(dbversion); err == nil {
			if err := store.Version().StoreDBVersion(v); err != nil {
				logrus.WithError(err).Errorf("DB_VERSION import issue")
			}
		}
	}
	if instanceID, ok := backup.Version["INSTANCE_ID"]; ok {
		if err := store.Version().StoreInstanceID(instanceID); err != nil {
			logrus.WithError(err).Errorf("INSTANCE_ID import issue")
		}
	}

	for _, v := range backup.CustomTemplate {
		store.CustomTemplate().UpdateCustomTemplate(v.ID, &v)
	}
	for _, v := range backup.EdgeGroup {
		store.EdgeGroup().UpdateEdgeGroup(v.ID, &v)
	}
	for _, v := range backup.EdgeJob {
		store.EdgeJob().UpdateEdgeJob(v.ID, &v)
	}
	for _, v := range backup.EdgeStack {
		store.EdgeStack().UpdateEdgeStack(v.ID, &v)
	}
	for _, v := range backup.Endpoint {
		store.Endpoint().UpdateEndpoint(v.ID, &v)
	}
	for _, v := range backup.EndpointGroup {
		store.EndpointGroup().UpdateEndpointGroup(v.ID, &v)
	}
	for _, v := range backup.EndpointRelation {
		store.EndpointRelation().UpdateEndpointRelation(v.EndpointID, &v)
	}
	// backup[store.HelmUserRepository().BucketName()], err = store.HelmUserRepository().HelmUserRepositorys()
	// for _, v := range backup.HelmUserRepository {
	// 	store.HelmUserRepository().UpdateHelmUserRepository(v.ID, &v)
	// }
	for _, v := range backup.Registry {
		store.Registry().UpdateRegistry(v.ID, &v)
	}
	for _, v := range backup.ResourceControl {
		store.ResourceControl().UpdateResourceControl(v.ID, &v)
	}
	for _, v := range backup.Role {
		store.Role().UpdateRole(v.ID, &v)
	}
	store.Settings().UpdateSettings(&backup.Settings)
	store.SSLSettings().UpdateSettings(&backup.SSLSettings)
	for _, v := range backup.Stack {
		store.Stack().UpdateStack(v.ID, &v)
	}
	for _, v := range backup.Tag {
		store.Tag().UpdateTag(v.ID, &v)
	}
	for _, v := range backup.TeamMembership {
		store.TeamMembership().UpdateTeamMembership(v.ID, &v)
	}
	for _, v := range backup.Team {
		store.Team().UpdateTeam(v.ID, &v)
	}
	store.TunnelServer().UpdateInfo(&backup.TunnelServer)

	for _, user := range backup.User {
		if err := store.User().UpdateUser(user.ID, &user); err != nil {
			logrus.WithField("user", user).WithError(err).Errorf("User: Failed to Update Database")
		}
	}

	// backup[store.Webhook().BucketName()], err = store.Webhook().Webhooks()
	// if err != nil {
	// 	logrus.WithError(err).Debugf("Export boom")
	// }

	return nil
}
