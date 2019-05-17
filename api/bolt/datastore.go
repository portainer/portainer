package bolt

import (
	"log"
	"path"
	"time"

	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/dockerhub"
	"github.com/portainer/portainer/api/bolt/endpoint"
	"github.com/portainer/portainer/api/bolt/endpointgroup"
	"github.com/portainer/portainer/api/bolt/extension"
	"github.com/portainer/portainer/api/bolt/migrator"
	"github.com/portainer/portainer/api/bolt/registry"
	"github.com/portainer/portainer/api/bolt/resourcecontrol"
	"github.com/portainer/portainer/api/bolt/role"
	"github.com/portainer/portainer/api/bolt/schedule"
	"github.com/portainer/portainer/api/bolt/settings"
	"github.com/portainer/portainer/api/bolt/stack"
	"github.com/portainer/portainer/api/bolt/tag"
	"github.com/portainer/portainer/api/bolt/team"
	"github.com/portainer/portainer/api/bolt/teammembership"
	"github.com/portainer/portainer/api/bolt/template"
	"github.com/portainer/portainer/api/bolt/user"
	"github.com/portainer/portainer/api/bolt/version"
	"github.com/portainer/portainer/api/bolt/webhook"
)

const (
	databaseFileName = "portainer.db"
)

// Store defines the implementation of portainer.DataStore using
// BoltDB as the storage system.
type Store struct {
	path                   string
	db                     *bolt.DB
	checkForDataMigration  bool
	fileService            portainer.FileService
	RoleService            *role.Service
	DockerHubService       *dockerhub.Service
	EndpointGroupService   *endpointgroup.Service
	EndpointService        *endpoint.Service
	ExtensionService       *extension.Service
	RegistryService        *registry.Service
	ResourceControlService *resourcecontrol.Service
	SettingsService        *settings.Service
	StackService           *stack.Service
	TagService             *tag.Service
	TeamMembershipService  *teammembership.Service
	TeamService            *team.Service
	TemplateService        *template.Service
	UserService            *user.Service
	VersionService         *version.Service
	WebhookService         *webhook.Service
	ScheduleService        *schedule.Service
}

// NewStore initializes a new Store and the associated services
func NewStore(storePath string, fileService portainer.FileService) (*Store, error) {
	store := &Store{
		path:        storePath,
		fileService: fileService,
	}

	databasePath := path.Join(storePath, databaseFileName)
	databaseFileExists, err := fileService.FileExists(databasePath)
	if err != nil {
		return nil, err
	}

	if !databaseFileExists {
		store.checkForDataMigration = false
	} else {
		store.checkForDataMigration = true
	}

	return store, nil
}

// Open opens and initializes the BoltDB database.
func (store *Store) Open() error {
	databasePath := path.Join(store.path, databaseFileName)
	db, err := bolt.Open(databasePath, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return err
	}
	store.db = db

	return store.initServices()
}

// TODO: relocate in its own file for readability
// Init creates the default data set.
func (store *Store) Init() error {
	groups, err := store.EndpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	if len(groups) == 0 {
		unassignedGroup := &portainer.EndpointGroup{
			Name:            "Unassigned",
			Description:     "Unassigned endpoints",
			Labels:          []portainer.Pair{},
			AuthorizedUsers: []portainer.UserID{},
			AuthorizedTeams: []portainer.TeamID{},
			Tags:            []string{},
		}

		err = store.EndpointGroupService.CreateEndpointGroup(unassignedGroup)
		if err != nil {
			return err
		}
	}

	roles, err := store.RoleService.Roles()
	if err != nil {
		return err
	}

	if len(roles) == 0 {
		//administratorRole := &portainer.Role{
		//	Name:        "Global administrator",
		//	Description: "Full-control over Portainer",
		//	Authorizations: map[portainer.Authorization]bool{
		//		portainer.OperationDockerContainerArchiveInfo:         true,
		//		portainer.OperationDockerContainerList:                true,
		//		portainer.OperationDockerContainerExport:              true,
		//		portainer.OperationDockerContainerChanges:             true,
		//		portainer.OperationDockerContainerInspect:             true,
		//		portainer.OperationDockerContainerTop:                 true,
		//		portainer.OperationDockerContainerLogs:                true,
		//		portainer.OperationDockerContainerStats:               true,
		//		portainer.OperationDockerContainerAttachWebsocket:     true,
		//		portainer.OperationDockerContainerArchive:             true,
		//		portainer.OperationDockerContainerCreate:              true,
		//		portainer.OperationDockerContainerPrune:               true,
		//		portainer.OperationDockerContainerKill:                true,
		//		portainer.OperationDockerContainerPause:               true,
		//		portainer.OperationDockerContainerUnpause:             true,
		//		portainer.OperationDockerContainerRestart:             true,
		//		portainer.OperationDockerContainerStart:               true,
		//		portainer.OperationDockerContainerStop:                true,
		//		portainer.OperationDockerContainerWait:                true,
		//		portainer.OperationDockerContainerResize:              true,
		//		portainer.OperationDockerContainerAttach:              true,
		//		portainer.OperationDockerContainerExec:                true,
		//		portainer.OperationDockerContainerRename:              true,
		//		portainer.OperationDockerContainerUpdate:              true,
		//		portainer.OperationDockerContainerPutContainerArchive: true,
		//		portainer.OperationDockerContainerDelete:              true,
		//		portainer.OperationDockerImageList:                    true,
		//		portainer.OperationDockerImageSearch:                  true,
		//		portainer.OperationDockerImageGetAll:                  true,
		//		portainer.OperationDockerImageGet:                     true,
		//		portainer.OperationDockerImageHistory:                 true,
		//		portainer.OperationDockerImageInspect:                 true,
		//		portainer.OperationDockerImageLoad:                    true,
		//		portainer.OperationDockerImageCreate:                  true,
		//		portainer.OperationDockerImagePrune:                   true,
		//		portainer.OperationDockerImagePush:                    true,
		//		portainer.OperationDockerImageTag:                     true,
		//		portainer.OperationDockerImageDelete:                  true,
		//		portainer.OperationDockerImageCommit:                  true,
		//		portainer.OperationDockerImageBuild:                   true,
		//		portainer.OperationDockerNetworkList:                  true,
		//		portainer.OperationDockerNetworkInspect:               true,
		//		portainer.OperationDockerNetworkCreate:                true,
		//		portainer.OperationDockerNetworkConnect:               true,
		//		portainer.OperationDockerNetworkDisconnect:            true,
		//		portainer.OperationDockerNetworkPrune:                 true,
		//		portainer.OperationDockerNetworkDelete:                true,
		//		portainer.OperationDockerVolumeList:                   true,
		//		portainer.OperationDockerVolumeInspect:                true,
		//		portainer.OperationDockerVolumeCreate:                 true,
		//		portainer.OperationDockerVolumePrune:                  true,
		//		portainer.OperationDockerVolumeDelete:                 true,
		//		portainer.OperationDockerExecInspect:                  true,
		//		portainer.OperationDockerExecStart:                    true,
		//		portainer.OperationDockerExecResize:                   true,
		//		portainer.OperationDockerSwarmInspect:                 true,
		//		portainer.OperationDockerSwarmUnlockKey:               true,
		//		portainer.OperationDockerSwarmInit:                    true,
		//		portainer.OperationDockerSwarmJoin:                    true,
		//		portainer.OperationDockerSwarmLeave:                   true,
		//		portainer.OperationDockerSwarmUpdate:                  true,
		//		portainer.OperationDockerSwarmUnlock:                  true,
		//		portainer.OperationDockerNodeList:                     true,
		//		portainer.OperationDockerNodeInspect:                  true,
		//		portainer.OperationDockerNodeUpdate:                   true,
		//		portainer.OperationDockerNodeDelete:                   true,
		//		portainer.OperationDockerServiceList:                  true,
		//		portainer.OperationDockerServiceInspect:               true,
		//		portainer.OperationDockerServiceLogs:                  true,
		//		portainer.OperationDockerServiceCreate:                true,
		//		portainer.OperationDockerServiceUpdate:                true,
		//		portainer.OperationDockerServiceDelete:                true,
		//		portainer.OperationDockerSecretList:                   true,
		//		portainer.OperationDockerSecretInspect:                true,
		//		portainer.OperationDockerSecretCreate:                 true,
		//		portainer.OperationDockerSecretUpdate:                 true,
		//		portainer.OperationDockerSecretDelete:                 true,
		//		portainer.OperationDockerConfigList:                   true,
		//		portainer.OperationDockerConfigInspect:                true,
		//		portainer.OperationDockerConfigCreate:                 true,
		//		portainer.OperationDockerConfigUpdate:                 true,
		//		portainer.OperationDockerConfigDelete:                 true,
		//		portainer.OperationDockerTaskList:                     true,
		//		portainer.OperationDockerTaskInspect:                  true,
		//		portainer.OperationDockerTaskLogs:                     true,
		//		portainer.OperationDockerPluginList:                   true,
		//		portainer.OperationDockerPluginPrivileges:             true,
		//		portainer.OperationDockerPluginInspect:                true,
		//		portainer.OperationDockerPluginPull:                   true,
		//		portainer.OperationDockerPluginCreate:                 true,
		//		portainer.OperationDockerPluginEnable:                 true,
		//		portainer.OperationDockerPluginDisable:                true,
		//		portainer.OperationDockerPluginPush:                   true,
		//		portainer.OperationDockerPluginUpgrade:                true,
		//		portainer.OperationDockerPluginSet:                    true,
		//		portainer.OperationDockerPluginDelete:                 true,
		//		portainer.OperationDockerSessionStart:                 true,
		//		portainer.OperationDockerDistributionInspect:          true,
		//		portainer.OperationDockerBuildPrune:                   true,
		//		portainer.OperationDockerBuildCancel:                  true,
		//		portainer.OperationPortainerDockerHubInspect:          true,
		//		portainer.OperationPortainerDockerHubUpdate:           true,
		//		portainer.OperationPortainerEndpointGroupCreate:       true,
		//		portainer.OperationPortainerEndpointGroupList:         true,
		//		portainer.OperationPortainerEndpointGroupDelete:       true,
		//		portainer.OperationPortainerEndpointGroupInspect:      true,
		//		portainer.OperationPortainerEndpointGroupUpdate:       true,
		//		portainer.OperationPortainerEndpointGroupAccess:       true,
		//		portainer.OperationPortainerEndpointList:              true,
		//		portainer.OperationPortainerEndpointInspect:           true,
		//		portainer.OperationPortainerEndpointCreate:            true,
		//		portainer.OperationPortainerEndpointExtensionAdd:      true,
		//		portainer.OperationPortainerEndpointJob:               true,
		//		portainer.OperationPortainerEndpointSnapshots:         true,
		//		portainer.OperationPortainerEndpointSnapshot:          true,
		//		portainer.OperationPortainerEndpointUpdate:            true,
		//		portainer.OperationPortainerEndpointUpdateAccess:      true,
		//		portainer.OperationPortainerEndpointDelete:            true,
		//		portainer.OperationPortainerEndpointExtensionRemove:   true,
		//		portainer.OperationPortainerExtensionList:             true,
		//		portainer.OperationPortainerExtensionInspect:          true,
		//		portainer.OperationPortainerExtensionCreate:           true,
		//		portainer.OperationPortainerExtensionUpdate:           true,
		//		portainer.OperationPortainerExtensionDelete:           true,
		//		portainer.OperationPortainerMOTD:                      true,
		//		portainer.OperationPortainerRegistryList:              true,
		//		portainer.OperationPortainerRegistryInspect:           true,
		//		portainer.OperationPortainerRegistryCreate:            true,
		//		portainer.OperationPortainerRegistryConfigure:         true,
		//		portainer.OperationPortainerRegistryUpdate:            true,
		//		portainer.OperationPortainerRegistryUpdateAccess:      true,
		//		portainer.OperationPortainerRegistryDelete:            true,
		//		portainer.OperationPortainerResourceControlCreate:     true,
		//		portainer.OperationPortainerResourceControlUpdate:     true,
		//		portainer.OperationPortainerResourceControlDelete:     true,
		//		portainer.OperationPortainerRoleList:                  true,
		//		portainer.OperationPortainerRoleInspect:               true,
		//		portainer.OperationPortainerRoleCreate:                true,
		//		portainer.OperationPortainerRoleUpdate:                true,
		//		portainer.OperationPortainerRoleDelete:                true,
		//		portainer.OperationPortainerScheduleList:              true,
		//		portainer.OperationPortainerScheduleInspect:           true,
		//		portainer.OperationPortainerScheduleFile:              true,
		//		portainer.OperationPortainerScheduleTasks:             true,
		//		portainer.OperationPortainerScheduleCreate:            true,
		//		portainer.OperationPortainerScheduleUpdate:            true,
		//		portainer.OperationPortainerScheduleDelete:            true,
		//		portainer.OperationPortainerSettingsInspect:           true,
		//		portainer.OperationPortainerSettingsUpdate:            true,
		//		portainer.OperationPortainerSettingsLDAPCheck:         true,
		//		portainer.OperationPortainerStackList:                 true,
		//		portainer.OperationPortainerStackInspect:              true,
		//		portainer.OperationPortainerStackFile:                 true,
		//		portainer.OperationPortainerStackCreate:               true,
		//		portainer.OperationPortainerStackMigrate:              true,
		//		portainer.OperationPortainerStackUpdate:               true,
		//		portainer.OperationPortainerStackDelete:               true,
		//		portainer.OperationPortainerTagList:                   true,
		//		portainer.OperationPortainerTagCreate:                 true,
		//		portainer.OperationPortainerTagDelete:                 true,
		//		portainer.OperationPortainerTeamMembershipList:        true,
		//		portainer.OperationPortainerTeamMembershipCreate:      true,
		//		portainer.OperationPortainerTeamMembershipUpdate:      true,
		//		portainer.OperationPortainerTeamMembershipDelete:      true,
		//		portainer.OperationPortainerTeamList:                  true,
		//		portainer.OperationPortainerTeamInspect:               true,
		//		portainer.OperationPortainerTeamMemberships:           true,
		//		portainer.OperationPortainerTeamCreate:                true,
		//		portainer.OperationPortainerTeamUpdate:                true,
		//		portainer.OperationPortainerTeamDelete:                true,
		//		portainer.OperationPortainerTemplateList:              true,
		//		portainer.OperationPortainerTemplateInspect:           true,
		//		portainer.OperationPortainerTemplateCreate:            true,
		//		portainer.OperationPortainerTemplateUpdate:            true,
		//		portainer.OperationPortainerTemplateDelete:            true,
		//		portainer.OperationPortainerUploadTLS:                 true,
		//		portainer.OperationPortainerUserList:                  true,
		//		portainer.OperationPortainerUserInspect:               true,
		//		portainer.OperationPortainerUserMemberships:           true,
		//		portainer.OperationPortainerUserCreate:                true,
		//		portainer.OperationPortainerUserUpdate:                true,
		//		portainer.OperationPortainerUserUpdatePassword:        true,
		//		portainer.OperationPortainerUserDelete:                true,
		//		portainer.OperationPortainerWebsocketExec:             true,
		//		portainer.OperationPortainerWebhookList:               true,
		//		portainer.OperationPortainerWebhookCreate:             true,
		//		portainer.OperationPortainerWebhookDelete:             true,
		//		portainer.OperationDockerPing:                         true,
		//		portainer.OperationDockerInfo:                         true,
		//		portainer.OperationDockerVersion:                      true,
		//		portainer.OperationDockerEvents:                       true,
		//		portainer.OperationDockerSystem:                       true,
		//		portainer.AccessEnvironment:                           true,
		//		portainer.AdministratorAccess:                         true,
		//	},
		//}
		//
		//err = store.RoleService.CreateRole(administratorRole)
		//if err != nil {
		//	return err
		//}

		environmentAdministratorRole := &portainer.Role{
			Name:        "Endpoint administrator",
			Description: "Full control on all the resources inside an endpoint",
			Authorizations: map[portainer.Authorization]bool{
				portainer.OperationDockerContainerArchiveInfo:         true,
				portainer.OperationDockerContainerList:                true,
				portainer.OperationDockerContainerExport:              true,
				portainer.OperationDockerContainerChanges:             true,
				portainer.OperationDockerContainerInspect:             true,
				portainer.OperationDockerContainerTop:                 true,
				portainer.OperationDockerContainerLogs:                true,
				portainer.OperationDockerContainerStats:               true,
				portainer.OperationDockerContainerAttachWebsocket:     true,
				portainer.OperationDockerContainerArchive:             true,
				portainer.OperationDockerContainerCreate:              true,
				portainer.OperationDockerContainerPrune:               true,
				portainer.OperationDockerContainerKill:                true,
				portainer.OperationDockerContainerPause:               true,
				portainer.OperationDockerContainerUnpause:             true,
				portainer.OperationDockerContainerRestart:             true,
				portainer.OperationDockerContainerStart:               true,
				portainer.OperationDockerContainerStop:                true,
				portainer.OperationDockerContainerWait:                true,
				portainer.OperationDockerContainerResize:              true,
				portainer.OperationDockerContainerAttach:              true,
				portainer.OperationDockerContainerExec:                true,
				portainer.OperationDockerContainerRename:              true,
				portainer.OperationDockerContainerUpdate:              true,
				portainer.OperationDockerContainerPutContainerArchive: true,
				portainer.OperationDockerContainerDelete:              true,
				portainer.OperationDockerImageList:                    true,
				portainer.OperationDockerImageSearch:                  true,
				portainer.OperationDockerImageGetAll:                  true,
				portainer.OperationDockerImageGet:                     true,
				portainer.OperationDockerImageHistory:                 true,
				portainer.OperationDockerImageInspect:                 true,
				portainer.OperationDockerImageLoad:                    true,
				portainer.OperationDockerImageCreate:                  true,
				portainer.OperationDockerImagePrune:                   true,
				portainer.OperationDockerImagePush:                    true,
				portainer.OperationDockerImageTag:                     true,
				portainer.OperationDockerImageDelete:                  true,
				portainer.OperationDockerImageCommit:                  true,
				portainer.OperationDockerImageBuild:                   true,
				portainer.OperationDockerNetworkList:                  true,
				portainer.OperationDockerNetworkInspect:               true,
				portainer.OperationDockerNetworkCreate:                true,
				portainer.OperationDockerNetworkConnect:               true,
				portainer.OperationDockerNetworkDisconnect:            true,
				portainer.OperationDockerNetworkPrune:                 true,
				portainer.OperationDockerNetworkDelete:                true,
				portainer.OperationDockerVolumeList:                   true,
				portainer.OperationDockerVolumeInspect:                true,
				portainer.OperationDockerVolumeCreate:                 true,
				portainer.OperationDockerVolumePrune:                  true,
				portainer.OperationDockerVolumeDelete:                 true,
				portainer.OperationDockerExecInspect:                  true,
				portainer.OperationDockerExecStart:                    true,
				portainer.OperationDockerExecResize:                   true,
				portainer.OperationDockerSwarmInspect:                 true,
				portainer.OperationDockerSwarmUnlockKey:               true,
				portainer.OperationDockerSwarmInit:                    true,
				portainer.OperationDockerSwarmJoin:                    true,
				portainer.OperationDockerSwarmLeave:                   true,
				portainer.OperationDockerSwarmUpdate:                  true,
				portainer.OperationDockerSwarmUnlock:                  true,
				portainer.OperationDockerNodeList:                     true,
				portainer.OperationDockerNodeInspect:                  true,
				portainer.OperationDockerNodeUpdate:                   true,
				portainer.OperationDockerNodeDelete:                   true,
				portainer.OperationDockerServiceList:                  true,
				portainer.OperationDockerServiceInspect:               true,
				portainer.OperationDockerServiceLogs:                  true,
				portainer.OperationDockerServiceCreate:                true,
				portainer.OperationDockerServiceUpdate:                true,
				portainer.OperationDockerServiceDelete:                true,
				portainer.OperationDockerSecretList:                   true,
				portainer.OperationDockerSecretInspect:                true,
				portainer.OperationDockerSecretCreate:                 true,
				portainer.OperationDockerSecretUpdate:                 true,
				portainer.OperationDockerSecretDelete:                 true,
				portainer.OperationDockerConfigList:                   true,
				portainer.OperationDockerConfigInspect:                true,
				portainer.OperationDockerConfigCreate:                 true,
				portainer.OperationDockerConfigUpdate:                 true,
				portainer.OperationDockerConfigDelete:                 true,
				portainer.OperationDockerTaskList:                     true,
				portainer.OperationDockerTaskInspect:                  true,
				portainer.OperationDockerTaskLogs:                     true,
				portainer.OperationDockerPluginList:                   true,
				portainer.OperationDockerPluginPrivileges:             true,
				portainer.OperationDockerPluginInspect:                true,
				portainer.OperationDockerPluginPull:                   true,
				portainer.OperationDockerPluginCreate:                 true,
				portainer.OperationDockerPluginEnable:                 true,
				portainer.OperationDockerPluginDisable:                true,
				portainer.OperationDockerPluginPush:                   true,
				portainer.OperationDockerPluginUpgrade:                true,
				portainer.OperationDockerPluginSet:                    true,
				portainer.OperationDockerPluginDelete:                 true,
				portainer.OperationDockerSessionStart:                 true,
				portainer.OperationDockerDistributionInspect:          true,
				portainer.OperationDockerBuildPrune:                   true,
				portainer.OperationDockerBuildCancel:                  true,
				portainer.OperationDockerPing:                         true,
				portainer.OperationDockerInfo:                         true,
				portainer.OperationDockerVersion:                      true,
				portainer.OperationDockerEvents:                       true,
				portainer.OperationDockerSystem:                       true,

				// Portainer context-bound authorizations
				portainer.OperationPortainerResourceControlCreate: true,
				portainer.OperationPortainerResourceControlUpdate: true,
				portainer.OperationPortainerResourceControlDelete: true,
				portainer.OperationPortainerStackList:             true,
				portainer.OperationPortainerStackInspect:          true,
				portainer.OperationPortainerStackFile:             true,
				portainer.OperationPortainerStackCreate:           true,
				portainer.OperationPortainerStackMigrate:          true,
				portainer.OperationPortainerStackUpdate:           true,
				portainer.OperationPortainerStackDelete:           true,
				portainer.OperationPortainerWebsocketExec:         true,
				portainer.OperationPortainerWebhookList:           true,
				portainer.OperationPortainerWebhookCreate:         true,
				portainer.OperationPortainerWebhookDelete:         true,

				// TODO: review it
				portainer.AccessEnvironment: true,
			},
		}

		// Portainer global authorizations
		//portainer.OperationPortainerDockerHubInspect: true,
		//// portainer.OperationPortainerDockerHubUpdate:           true,
		//// portainer.OperationPortainerEndpointGroupCreate:       true,
		//	portainer.OperationPortainerEndpointGroupList: true,
		//// portainer.OperationPortainerEndpointGroupDelete:       true,
		//// portainer.OperationPortainerEndpointGroupInspect:      true,
		//// portainer.OperationPortainerEndpointGroupUpdate:       true,
		//// portainer.OperationPortainerEndpointGroupAccess:       true,
		//	portainer.OperationPortainerEndpointList:    true,
		//	portainer.OperationPortainerEndpointInspect: true,
		//// portainer.OperationPortainerEndpointCreate:            true,
		//// portainer.OperationPortainerEndpointExtensionAdd:      true,
		//// portainer.OperationPortainerEndpointJob:               true,
		//// portainer.OperationPortainerEndpointSnapshots:         true,
		//// portainer.OperationPortainerEndpointSnapshot:          true,
		//// portainer.OperationPortainerEndpointUpdate:            true,
		//// portainer.OperationPortainerEndpointUpdateAccess:      true,
		//// portainer.OperationPortainerEndpointDelete:            true,
		//	portainer.OperationPortainerEndpointExtensionRemove: true,
		//	portainer.OperationPortainerExtensionList:           true,
		//// portainer.OperationPortainerExtensionInspect:          true,
		//// portainer.OperationPortainerExtensionCreate:           true,
		//// portainer.OperationPortainerExtensionUpdate:           true,
		//// portainer.OperationPortainerExtensionDelete:           true,
		//	portainer.OperationPortainerMOTD:         true,
		//	portainer.OperationPortainerRegistryList: true,
		//// portainer.OperationPortainerRegistryInspect:           true,
		//// portainer.OperationPortainerRegistryCreate:            true,
		//// portainer.OperationPortainerRegistryConfigure:         true,
		//// portainer.OperationPortainerRegistryUpdate:            true,
		//// portainer.OperationPortainerRegistryUpdateAccess:      true,
		//// portainer.OperationPortainerRegistryDelete:            true,
		//
		//// portainer.OperationPortainerRoleList:                  true,
		//// portainer.OperationPortainerRoleInspect:               true,
		//// portainer.OperationPortainerRoleCreate:                true,
		//// portainer.OperationPortainerRoleUpdate:                true,
		//// portainer.OperationPortainerRoleDelete:                true,
		//// portainer.OperationPortainerScheduleList:              true,
		//// portainer.OperationPortainerScheduleInspect:           true,
		//// portainer.OperationPortainerScheduleFile:              true,
		//// portainer.OperationPortainerScheduleTasks:             true,
		//// portainer.OperationPortainerScheduleCreate:            true,
		//// portainer.OperationPortainerScheduleUpdate:            true,
		//// portainer.OperationPortainerScheduleDelete:            true,
		//// portainer.OperationPortainerSettingsInspect:           true,
		//// portainer.OperationPortainerSettingsUpdate:            true,
		//// portainer.OperationPortainerSettingsLDAPCheck:         true,
		//
		//// portainer.OperationPortainerTagList:                   true,
		//// portainer.OperationPortainerTagCreate:                 true,
		//// portainer.OperationPortainerTagDelete:                 true,
		//// portainer.OperationPortainerTeamMembershipList:        true,
		//// portainer.OperationPortainerTeamMembershipCreate:      true,
		//// portainer.OperationPortainerTeamMembershipUpdate:      true,
		//// portainer.OperationPortainerTeamMembershipDelete:      true,
		//	portainer.OperationPortainerTeamList: true,
		//// portainer.OperationPortainerTeamInspect:               true,
		//// portainer.OperationPortainerTeamMemberships:           true,
		//// portainer.OperationPortainerTeamCreate:                true,
		//// portainer.OperationPortainerTeamUpdate:                true,
		//// portainer.OperationPortainerTeamDelete:                true,
		//	portainer.OperationPortainerTemplateList:    true,
		//	portainer.OperationPortainerTemplateInspect: true,
		////portainer.OperationPortainerTemplateCreate:  true,
		////portainer.OperationPortainerTemplateUpdate:  true,
		////portainer.OperationPortainerTemplateDelete:  true,
		//// portainer.OperationPortainerUploadTLS:                 true,
		//	portainer.OperationPortainerUserList: true,
		//// portainer.OperationPortainerUserInspect:               true,
		//	portainer.OperationPortainerUserMemberships: true,
		//// portainer.OperationPortainerUserCreate:                true,
		//// portainer.OperationPortainerUserUpdate:                true,
		//// portainer.OperationPortainerUserUpdatePassword:        true,
		//// portainer.OperationPortainerUserDelete:                true,

		err = store.RoleService.CreateRole(environmentAdministratorRole)
		if err != nil {
			return err
		}

		environmentReadOnlyUserRole := &portainer.Role{
			Name:        "Helpdesk",
			Description: "Read-only authorizations on all the resources inside an endpoint",
			Authorizations: map[portainer.Authorization]bool{
				portainer.OperationDockerContainerArchiveInfo: true,
				portainer.OperationDockerContainerList:        true,
				// portainer.OperationDockerContainerExport:              true,
				portainer.OperationDockerContainerChanges: true,
				portainer.OperationDockerContainerInspect: true,
				portainer.OperationDockerContainerTop:     true,
				portainer.OperationDockerContainerLogs:    true,
				portainer.OperationDockerContainerStats:   true,
				// portainer.OperationDockerContainerAttachWebsocket:     true,
				// portainer.OperationDockerContainerArchive:             true,
				// portainer.OperationDockerContainerCreate:              true,
				// portainer.OperationDockerContainerPrune:               true,
				// portainer.OperationDockerContainerKill:                true,
				// portainer.OperationDockerContainerPause:               true,
				// portainer.OperationDockerContainerUnpause:             true,
				// portainer.OperationDockerContainerRestart:             true,
				// portainer.OperationDockerContainerStart:               true,
				// portainer.OperationDockerContainerStop:                true,
				// portainer.OperationDockerContainerWait:                true,
				// portainer.OperationDockerContainerResize:              true,
				// portainer.OperationDockerContainerAttach:              true,
				// portainer.OperationDockerContainerExec:                true,
				// portainer.OperationDockerContainerRename:              true,
				// portainer.OperationDockerContainerUpdate:              true,
				// portainer.OperationDockerContainerPutContainerArchive: true,
				// portainer.OperationDockerContainerDelete:              true,
				portainer.OperationDockerImageList:    true,
				portainer.OperationDockerImageSearch:  true,
				portainer.OperationDockerImageGetAll:  true,
				portainer.OperationDockerImageGet:     true,
				portainer.OperationDockerImageHistory: true,
				portainer.OperationDockerImageInspect: true,
				// portainer.OperationDockerImageLoad:                    true,
				// portainer.OperationDockerImageCreate:                  true,
				// portainer.OperationDockerImagePrune:                   true,
				// portainer.OperationDockerImagePush:                    true,
				// portainer.OperationDockerImageTag:                     true,
				// portainer.OperationDockerImageDelete:                  true,
				// portainer.OperationDockerImageCommit:                  true,
				// portainer.OperationDockerImageBuild:                   true,
				portainer.OperationDockerNetworkList:    true,
				portainer.OperationDockerNetworkInspect: true,
				// portainer.OperationDockerNetworkCreate:                true,
				// portainer.OperationDockerNetworkConnect:               true,
				// portainer.OperationDockerNetworkDisconnect:            true,
				// portainer.OperationDockerNetworkPrune:                 true,
				// portainer.OperationDockerNetworkDelete:                true,
				portainer.OperationDockerVolumeList:    true,
				portainer.OperationDockerVolumeInspect: true,
				// portainer.OperationDockerVolumeCreate:                 true,
				// portainer.OperationDockerVolumePrune:                  true,
				// portainer.OperationDockerVolumeDelete:                 true,
				// portainer.OperationDockerExecInspect:                  true,
				// portainer.OperationDockerExecStart:                    true,
				// portainer.OperationDockerExecResize:                   true,
				portainer.OperationDockerSwarmInspect: true,
				// portainer.OperationDockerSwarmUnlockKey:               true,
				// portainer.OperationDockerSwarmInit:                    true,
				// portainer.OperationDockerSwarmJoin:                    true,
				// portainer.OperationDockerSwarmLeave:                   true,
				// portainer.OperationDockerSwarmUpdate:                  true,
				// portainer.OperationDockerSwarmUnlock:                  true,
				portainer.OperationDockerNodeList:    true,
				portainer.OperationDockerNodeInspect: true,
				// portainer.OperationDockerNodeUpdate:                   true,
				// portainer.OperationDockerNodeDelete:                   true,
				portainer.OperationDockerServiceList:    true,
				portainer.OperationDockerServiceInspect: true,
				portainer.OperationDockerServiceLogs:    true,
				// portainer.OperationDockerServiceCreate:                true,
				// portainer.OperationDockerServiceUpdate:                true,
				// portainer.OperationDockerServiceDelete:                true,
				portainer.OperationDockerSecretList:    true,
				portainer.OperationDockerSecretInspect: true,
				// portainer.OperationDockerSecretCreate:                 true,
				// portainer.OperationDockerSecretUpdate:                 true,
				// portainer.OperationDockerSecretDelete:                 true,
				portainer.OperationDockerConfigList:    true,
				portainer.OperationDockerConfigInspect: true,
				// portainer.OperationDockerConfigCreate:                 true,
				// portainer.OperationDockerConfigUpdate:                 true,
				// portainer.OperationDockerConfigDelete:                 true,
				portainer.OperationDockerTaskList:    true,
				portainer.OperationDockerTaskInspect: true,
				portainer.OperationDockerTaskLogs:    true,
				portainer.OperationDockerPluginList:  true,
				// portainer.OperationDockerPluginPrivileges:             true,
				// portainer.OperationDockerPluginInspect:                true,
				// portainer.OperationDockerPluginPull:                   true,
				// portainer.OperationDockerPluginCreate:                 true,
				// portainer.OperationDockerPluginEnable:                 true,
				// portainer.OperationDockerPluginDisable:                true,
				// portainer.OperationDockerPluginPush:                   true,
				// portainer.OperationDockerPluginUpgrade:                true,
				// portainer.OperationDockerPluginSet:                    true,
				// portainer.OperationDockerPluginDelete:                 true,
				// portainer.OperationDockerSessionStart:                 true,
				portainer.OperationDockerDistributionInspect: true,
				// portainer.OperationDockerBuildPrune:                   true,
				// portainer.OperationDockerBuildCancel:                  true,
				portainer.OperationDockerPing:    true,
				portainer.OperationDockerInfo:    true,
				portainer.OperationDockerVersion: true,
				portainer.OperationDockerEvents:  true,
				portainer.OperationDockerSystem:  true,

				// Portainer context-bound authorizations
				portainer.OperationPortainerStackList:    true,
				portainer.OperationPortainerStackInspect: true,
				portainer.OperationPortainerStackFile:    true,
				portainer.OperationPortainerWebhookList:  true,
				portainer.AccessEnvironment:              true,
			},
		}

		// Portainer global authorizations
		//portainer.OperationPortainerDockerHubInspect: true,
		//// portainer.OperationPortainerDockerHubUpdate:           true,
		//// portainer.OperationPortainerEndpointGroupCreate:       true,
		//	portainer.OperationPortainerEndpointGroupList: true,
		//// portainer.OperationPortainerEndpointGroupDelete:       true,
		//// portainer.OperationPortainerEndpointGroupInspect:      true,
		//// portainer.OperationPortainerEndpointGroupUpdate:       true,
		//// portainer.OperationPortainerEndpointGroupAccess:       true,
		//	portainer.OperationPortainerEndpointList:    true,
		//	portainer.OperationPortainerEndpointInspect: true,
		//// portainer.OperationPortainerEndpointCreate:            true,
		//// portainer.OperationPortainerEndpointExtensionAdd:      true,
		//// portainer.OperationPortainerEndpointJob:               true,
		//// portainer.OperationPortainerEndpointSnapshots:         true,
		//// portainer.OperationPortainerEndpointSnapshot:          true,
		//// portainer.OperationPortainerEndpointUpdate:            true,
		//// portainer.OperationPortainerEndpointUpdateAccess:      true,
		//// portainer.OperationPortainerEndpointDelete:            true,
		//	portainer.OperationPortainerEndpointExtensionRemove: true,
		//	portainer.OperationPortainerExtensionList:           true,
		//// portainer.OperationPortainerExtensionInspect:          true,
		//// portainer.OperationPortainerExtensionCreate:           true,
		//// portainer.OperationPortainerExtensionUpdate:           true,
		//// portainer.OperationPortainerExtensionDelete:           true,
		//	portainer.OperationPortainerMOTD:         true,
		//	portainer.OperationPortainerRegistryList: true,
		//// portainer.OperationPortainerRegistryInspect:           true,
		//// portainer.OperationPortainerRegistryCreate:            true,
		//// portainer.OperationPortainerRegistryConfigure:         true,
		//// portainer.OperationPortainerRegistryUpdate:            true,
		//// portainer.OperationPortainerRegistryUpdateAccess:      true,
		//// portainer.OperationPortainerRegistryDelete:            true,
		//// portainer.OperationPortainerResourceControlCreate:     true,
		//// portainer.OperationPortainerResourceControlUpdate:     true,
		//// portainer.OperationPortainerResourceControlDelete:     true,
		//// portainer.OperationPortainerRoleList:                  true,
		//// portainer.OperationPortainerRoleInspect:               true,
		//// portainer.OperationPortainerRoleCreate:                true,
		//// portainer.OperationPortainerRoleUpdate:                true,
		//// portainer.OperationPortainerRoleDelete:                true,
		//// portainer.OperationPortainerScheduleList:              true,
		//// portainer.OperationPortainerScheduleInspect:           true,
		//// portainer.OperationPortainerScheduleFile:              true,
		//// portainer.OperationPortainerScheduleTasks:             true,
		//// portainer.OperationPortainerScheduleCreate:            true,
		//// portainer.OperationPortainerScheduleUpdate:            true,
		//// portainer.OperationPortainerScheduleDelete:            true,
		//// portainer.OperationPortainerSettingsInspect:           true,
		//// portainer.OperationPortainerSettingsUpdate:            true,
		//// portainer.OperationPortainerSettingsLDAPCheck:         true,
		//
		//// portainer.OperationPortainerStackCreate:               true,
		//// portainer.OperationPortainerStackMigrate:              true,
		//// portainer.OperationPortainerStackUpdate:               true,
		//// portainer.OperationPortainerStackDelete:               true,
		//// portainer.OperationPortainerTagList:                   true,
		//// portainer.OperationPortainerTagCreate:                 true,
		//// portainer.OperationPortainerTagDelete:                 true,
		//// portainer.OperationPortainerTeamMembershipList:        true,
		//// portainer.OperationPortainerTeamMembershipCreate:      true,
		//// portainer.OperationPortainerTeamMembershipUpdate:      true,
		//// portainer.OperationPortainerTeamMembershipDelete:      true,
		//	portainer.OperationPortainerTeamList: true,
		//// portainer.OperationPortainerTeamInspect:               true,
		//// portainer.OperationPortainerTeamMemberships:           true,
		//// portainer.OperationPortainerTeamCreate:                true,
		//// portainer.OperationPortainerTeamUpdate:                true,
		//// portainer.OperationPortainerTeamDelete:                true,
		//	portainer.OperationPortainerTemplateList:    true,
		//	portainer.OperationPortainerTemplateInspect: true,
		//// portainer.OperationPortainerTemplateCreate:            true,
		//// portainer.OperationPortainerTemplateUpdate:            true,
		//// portainer.OperationPortainerTemplateDelete:            true,
		//// portainer.OperationPortainerUploadTLS:                 true,
		//	portainer.OperationPortainerUserList: true,
		//// portainer.OperationPortainerUserInspect:               true,
		//	portainer.OperationPortainerUserMemberships: true,
		//// portainer.OperationPortainerUserCreate:                true,
		//// portainer.OperationPortainerUserUpdate:                true,
		//// portainer.OperationPortainerUserUpdatePassword:        true,
		//// portainer.OperationPortainerUserDelete:                true,
		//// portainer.OperationPortainerWebsocketExec:             true,
		//// portainer.OperationPortainerWebhookCreate:             true,
		//// portainer.OperationPortainerWebhookDelete:             true,

		err = store.RoleService.CreateRole(environmentReadOnlyUserRole)
		if err != nil {
			return err
		}

		standardUserRole := &portainer.Role{
			Name:        "Standard user",
			Description: "Regular user account restricted to access authorized resources",
			Authorizations: map[portainer.Authorization]bool{
				portainer.OperationDockerContainerArchiveInfo:     true,
				portainer.OperationDockerContainerList:            true,
				portainer.OperationDockerContainerExport:          true,
				portainer.OperationDockerContainerChanges:         true,
				portainer.OperationDockerContainerInspect:         true,
				portainer.OperationDockerContainerTop:             true,
				portainer.OperationDockerContainerLogs:            true,
				portainer.OperationDockerContainerStats:           true,
				portainer.OperationDockerContainerAttachWebsocket: true,
				portainer.OperationDockerContainerArchive:         true,
				portainer.OperationDockerContainerCreate:          true,
				// portainer.OperationDockerContainerPrune:               true,
				portainer.OperationDockerContainerKill:                true,
				portainer.OperationDockerContainerPause:               true,
				portainer.OperationDockerContainerUnpause:             true,
				portainer.OperationDockerContainerRestart:             true,
				portainer.OperationDockerContainerStart:               true,
				portainer.OperationDockerContainerStop:                true,
				portainer.OperationDockerContainerWait:                true,
				portainer.OperationDockerContainerResize:              true,
				portainer.OperationDockerContainerAttach:              true,
				portainer.OperationDockerContainerExec:                true,
				portainer.OperationDockerContainerRename:              true,
				portainer.OperationDockerContainerUpdate:              true,
				portainer.OperationDockerContainerPutContainerArchive: true,
				portainer.OperationDockerContainerDelete:              true,
				portainer.OperationDockerImageList:                    true,
				portainer.OperationDockerImageSearch:                  true,
				portainer.OperationDockerImageGetAll:                  true,
				portainer.OperationDockerImageGet:                     true,
				portainer.OperationDockerImageHistory:                 true,
				portainer.OperationDockerImageInspect:                 true,
				portainer.OperationDockerImageLoad:                    true,
				portainer.OperationDockerImageCreate:                  true,
				// portainer.OperationDockerImagePrune:                   true,
				portainer.OperationDockerImagePush:         true,
				portainer.OperationDockerImageTag:          true,
				portainer.OperationDockerImageDelete:       true,
				portainer.OperationDockerImageCommit:       true,
				portainer.OperationDockerImageBuild:        true,
				portainer.OperationDockerNetworkList:       true,
				portainer.OperationDockerNetworkInspect:    true,
				portainer.OperationDockerNetworkCreate:     true,
				portainer.OperationDockerNetworkConnect:    true,
				portainer.OperationDockerNetworkDisconnect: true,
				// portainer.OperationDockerNetworkPrune:                 true,
				portainer.OperationDockerNetworkDelete: true,
				portainer.OperationDockerVolumeList:    true,
				portainer.OperationDockerVolumeInspect: true,
				portainer.OperationDockerVolumeCreate:  true,
				// portainer.OperationDockerVolumePrune:                  true,
				portainer.OperationDockerVolumeDelete:        true,
				portainer.OperationDockerExecInspect:         true,
				portainer.OperationDockerExecStart:           true,
				portainer.OperationDockerExecResize:          true,
				portainer.OperationDockerSwarmInspect:        true,
				portainer.OperationDockerSwarmUnlockKey:      true,
				portainer.OperationDockerSwarmInit:           true,
				portainer.OperationDockerSwarmJoin:           true,
				portainer.OperationDockerSwarmLeave:          true,
				portainer.OperationDockerSwarmUpdate:         true,
				portainer.OperationDockerSwarmUnlock:         true,
				portainer.OperationDockerNodeList:            true,
				portainer.OperationDockerNodeInspect:         true,
				portainer.OperationDockerNodeUpdate:          true,
				portainer.OperationDockerNodeDelete:          true,
				portainer.OperationDockerServiceList:         true,
				portainer.OperationDockerServiceInspect:      true,
				portainer.OperationDockerServiceLogs:         true,
				portainer.OperationDockerServiceCreate:       true,
				portainer.OperationDockerServiceUpdate:       true,
				portainer.OperationDockerServiceDelete:       true,
				portainer.OperationDockerSecretList:          true,
				portainer.OperationDockerSecretInspect:       true,
				portainer.OperationDockerSecretCreate:        true,
				portainer.OperationDockerSecretUpdate:        true,
				portainer.OperationDockerSecretDelete:        true,
				portainer.OperationDockerConfigList:          true,
				portainer.OperationDockerConfigInspect:       true,
				portainer.OperationDockerConfigCreate:        true,
				portainer.OperationDockerConfigUpdate:        true,
				portainer.OperationDockerConfigDelete:        true,
				portainer.OperationDockerTaskList:            true,
				portainer.OperationDockerTaskInspect:         true,
				portainer.OperationDockerTaskLogs:            true,
				portainer.OperationDockerPluginList:          true,
				portainer.OperationDockerPluginPrivileges:    true,
				portainer.OperationDockerPluginInspect:       true,
				portainer.OperationDockerPluginPull:          true,
				portainer.OperationDockerPluginCreate:        true,
				portainer.OperationDockerPluginEnable:        true,
				portainer.OperationDockerPluginDisable:       true,
				portainer.OperationDockerPluginPush:          true,
				portainer.OperationDockerPluginUpgrade:       true,
				portainer.OperationDockerPluginSet:           true,
				portainer.OperationDockerPluginDelete:        true,
				portainer.OperationDockerSessionStart:        true,
				portainer.OperationDockerDistributionInspect: true,
				portainer.OperationDockerBuildPrune:          true,
				portainer.OperationDockerBuildCancel:         true,
				portainer.OperationDockerPing:                true,
				portainer.OperationDockerInfo:                true,
				portainer.OperationDockerVersion:             true,
				portainer.OperationDockerEvents:              true,
				portainer.OperationDockerSystem:              true,

				// Portainer context-bound authorizations
				portainer.OperationPortainerResourceControlCreate: true,
				portainer.OperationPortainerResourceControlUpdate: true,
				portainer.OperationPortainerResourceControlDelete: true,
				portainer.OperationPortainerStackList:             true,
				portainer.OperationPortainerStackInspect:          true,
				portainer.OperationPortainerStackFile:             true,
				portainer.OperationPortainerStackCreate:           true,
				portainer.OperationPortainerStackMigrate:          true,
				portainer.OperationPortainerStackUpdate:           true,
				portainer.OperationPortainerStackDelete:           true,
				portainer.OperationPortainerWebsocketExec:         true,
				portainer.OperationPortainerWebhookList:           true,
				portainer.OperationPortainerWebhookCreate:         true,

				portainer.AccessEnvironment: true,
			},

			// Portainer global authorizations
			//portainer.OperationPortainerDockerHubInspect: true,
			//// portainer.OperationPortainerDockerHubUpdate:           true,
			//// portainer.OperationPortainerEndpointGroupCreate:       true,
			//portainer.OperationPortainerEndpointGroupList: true,
			//// portainer.OperationPortainerEndpointGroupDelete:       true,
			//// portainer.OperationPortainerEndpointGroupInspect:      true,
			//// portainer.OperationPortainerEndpointGroupUpdate:       true,
			//// portainer.OperationPortainerEndpointGroupAccess:       true,
			//portainer.OperationPortainerEndpointList:    true,
			//portainer.OperationPortainerEndpointInspect: true,
			//// portainer.OperationPortainerEndpointCreate:            true,
			//// portainer.OperationPortainerEndpointExtensionAdd:      true,
			//// portainer.OperationPortainerEndpointJob:               true,
			//// portainer.OperationPortainerEndpointSnapshots:         true,
			//// portainer.OperationPortainerEndpointSnapshot:          true,
			//// portainer.OperationPortainerEndpointUpdate:            true,
			//// portainer.OperationPortainerEndpointUpdateAccess:      true,
			//// portainer.OperationPortainerEndpointDelete:            true,
			//portainer.OperationPortainerEndpointExtensionRemove: true,
			//portainer.OperationPortainerExtensionList:           true,
			//// portainer.OperationPortainerExtensionInspect:          true,
			//// portainer.OperationPortainerExtensionCreate:           true,
			//// portainer.OperationPortainerExtensionUpdate:           true,
			//// portainer.OperationPortainerExtensionDelete:           true,
			//portainer.OperationPortainerMOTD:         true,
			//portainer.OperationPortainerRegistryList: true,
			//// portainer.OperationPortainerRegistryInspect:           true,
			//// portainer.OperationPortainerRegistryCreate:            true,
			//// portainer.OperationPortainerRegistryConfigure:         true,
			//// portainer.OperationPortainerRegistryUpdate:            true,
			//// portainer.OperationPortainerRegistryUpdateAccess:      true,
			//// portainer.OperationPortainerRegistryDelete:            true,
			//
			//// portainer.OperationPortainerRoleList:                  true,
			//// portainer.OperationPortainerRoleInspect:               true,
			//// portainer.OperationPortainerRoleCreate:                true,
			//// portainer.OperationPortainerRoleUpdate:                true,
			//// portainer.OperationPortainerRoleDelete:                true,
			//// portainer.OperationPortainerScheduleList:              true,
			//// portainer.OperationPortainerScheduleInspect:           true,
			//// portainer.OperationPortainerScheduleFile:              true,
			//// portainer.OperationPortainerScheduleTasks:             true,
			//// portainer.OperationPortainerScheduleCreate:            true,
			//// portainer.OperationPortainerScheduleUpdate:            true,
			//// portainer.OperationPortainerScheduleDelete:            true,
			//// portainer.OperationPortainerSettingsInspect:           true,
			//// portainer.OperationPortainerSettingsUpdate:            true,
			//// portainer.OperationPortainerSettingsLDAPCheck:         true,
			//
			//// portainer.OperationPortainerTagList:                   true,
			//// portainer.OperationPortainerTagCreate:                 true,
			//// portainer.OperationPortainerTagDelete:                 true,
			//// portainer.OperationPortainerTeamMembershipList:        true,
			//// portainer.OperationPortainerTeamMembershipCreate:      true,
			//// portainer.OperationPortainerTeamMembershipUpdate:      true,
			//// portainer.OperationPortainerTeamMembershipDelete:      true,
			//portainer.OperationPortainerTeamList: true,
			//// portainer.OperationPortainerTeamInspect:               true,
			//// portainer.OperationPortainerTeamMemberships:           true,
			//// portainer.OperationPortainerTeamCreate:                true,
			//// portainer.OperationPortainerTeamUpdate:                true,
			//// portainer.OperationPortainerTeamDelete:                true,
			//portainer.OperationPortainerTemplateList:    true,
			//portainer.OperationPortainerTemplateInspect: true,
			//portainer.OperationPortainerTemplateCreate:  true,
			//portainer.OperationPortainerTemplateUpdate:  true,
			//portainer.OperationPortainerTemplateDelete:  true,
			//// portainer.OperationPortainerUploadTLS:                 true,
			//portainer.OperationPortainerUserList: true,
			//// portainer.OperationPortainerUserInspect:               true,
			//portainer.OperationPortainerUserMemberships: true,
			//// portainer.OperationPortainerUserCreate:                true,
			//// portainer.OperationPortainerUserUpdate:                true,
			//// portainer.OperationPortainerUserUpdatePassword:        true,
			//// portainer.OperationPortainerUserDelete:                true,
			//
			//// portainer.OperationPortainerWebhookDelete:             true,
		}

		err = store.RoleService.CreateRole(standardUserRole)
		if err != nil {
			return err
		}

		readOnlyUserRole := &portainer.Role{
			Name:        "Read-only user",
			Description: "Read-only user account restricted to access authorized resources",
			Authorizations: map[portainer.Authorization]bool{
				portainer.OperationDockerContainerArchiveInfo: true,
				portainer.OperationDockerContainerList:        true,
				// portainer.OperationDockerContainerExport:              true,
				portainer.OperationDockerContainerChanges: true,
				portainer.OperationDockerContainerInspect: true,
				portainer.OperationDockerContainerTop:     true,
				portainer.OperationDockerContainerLogs:    true,
				portainer.OperationDockerContainerStats:   true,
				// portainer.OperationDockerContainerAttachWebsocket:     true,
				// portainer.OperationDockerContainerArchive:             true,
				// portainer.OperationDockerContainerCreate:              true,
				// portainer.OperationDockerContainerPrune:               true,
				// portainer.OperationDockerContainerKill:                true,
				// portainer.OperationDockerContainerPause:               true,
				// portainer.OperationDockerContainerUnpause:             true,
				// portainer.OperationDockerContainerRestart:             true,
				// portainer.OperationDockerContainerStart:               true,
				// portainer.OperationDockerContainerStop:                true,
				// portainer.OperationDockerContainerWait:                true,
				// portainer.OperationDockerContainerResize:              true,
				// portainer.OperationDockerContainerAttach:              true,
				// portainer.OperationDockerContainerExec:                true,
				// portainer.OperationDockerContainerRename:              true,
				// portainer.OperationDockerContainerUpdate:              true,
				// portainer.OperationDockerContainerPutContainerArchive: true,
				// portainer.OperationDockerContainerDelete:              true,
				portainer.OperationDockerImageList:    true,
				portainer.OperationDockerImageSearch:  true,
				portainer.OperationDockerImageGetAll:  true,
				portainer.OperationDockerImageGet:     true,
				portainer.OperationDockerImageHistory: true,
				portainer.OperationDockerImageInspect: true,
				// portainer.OperationDockerImageLoad:                    true,
				// portainer.OperationDockerImageCreate:                  true,
				// portainer.OperationDockerImagePrune:                   true,
				// portainer.OperationDockerImagePush:                    true,
				// portainer.OperationDockerImageTag:                     true,
				// portainer.OperationDockerImageDelete:                  true,
				// portainer.OperationDockerImageCommit:                  true,
				// portainer.OperationDockerImageBuild:                   true,
				portainer.OperationDockerNetworkList:    true,
				portainer.OperationDockerNetworkInspect: true,
				// portainer.OperationDockerNetworkCreate:                true,
				// portainer.OperationDockerNetworkConnect:               true,
				// portainer.OperationDockerNetworkDisconnect:            true,
				// portainer.OperationDockerNetworkPrune:                 true,
				// portainer.OperationDockerNetworkDelete:                true,
				portainer.OperationDockerVolumeList:    true,
				portainer.OperationDockerVolumeInspect: true,
				// portainer.OperationDockerVolumeCreate:                 true,
				// portainer.OperationDockerVolumePrune:                  true,
				// portainer.OperationDockerVolumeDelete:                 true,
				// portainer.OperationDockerExecInspect:                  true,
				// portainer.OperationDockerExecStart:                    true,
				// portainer.OperationDockerExecResize:                   true,
				portainer.OperationDockerSwarmInspect: true,
				// portainer.OperationDockerSwarmUnlockKey:               true,
				// portainer.OperationDockerSwarmInit:                    true,
				// portainer.OperationDockerSwarmJoin:                    true,
				// portainer.OperationDockerSwarmLeave:                   true,
				// portainer.OperationDockerSwarmUpdate:                  true,
				// portainer.OperationDockerSwarmUnlock:                  true,
				portainer.OperationDockerNodeList:    true,
				portainer.OperationDockerNodeInspect: true,
				// portainer.OperationDockerNodeUpdate:                   true,
				// portainer.OperationDockerNodeDelete:                   true,
				portainer.OperationDockerServiceList:    true,
				portainer.OperationDockerServiceInspect: true,
				portainer.OperationDockerServiceLogs:    true,
				// portainer.OperationDockerServiceCreate:                true,
				// portainer.OperationDockerServiceUpdate:                true,
				// portainer.OperationDockerServiceDelete:                true,
				portainer.OperationDockerSecretList:    true,
				portainer.OperationDockerSecretInspect: true,
				// portainer.OperationDockerSecretCreate:                 true,
				// portainer.OperationDockerSecretUpdate:                 true,
				// portainer.OperationDockerSecretDelete:                 true,
				portainer.OperationDockerConfigList:    true,
				portainer.OperationDockerConfigInspect: true,
				// portainer.OperationDockerConfigCreate:                 true,
				// portainer.OperationDockerConfigUpdate:                 true,
				// portainer.OperationDockerConfigDelete:                 true,
				portainer.OperationDockerTaskList:    true,
				portainer.OperationDockerTaskInspect: true,
				portainer.OperationDockerTaskLogs:    true,
				portainer.OperationDockerPluginList:  true,
				// portainer.OperationDockerPluginPrivileges:             true,
				// portainer.OperationDockerPluginInspect:                true,
				// portainer.OperationDockerPluginPull:                   true,
				// portainer.OperationDockerPluginCreate:                 true,
				// portainer.OperationDockerPluginEnable:                 true,
				// portainer.OperationDockerPluginDisable:                true,
				// portainer.OperationDockerPluginPush:                   true,
				// portainer.OperationDockerPluginUpgrade:                true,
				// portainer.OperationDockerPluginSet:                    true,
				// portainer.OperationDockerPluginDelete:                 true,
				// portainer.OperationDockerSessionStart:                 true,
				portainer.OperationDockerDistributionInspect: true,
				// portainer.OperationDockerBuildPrune:                   true,
				// portainer.OperationDockerBuildCancel:                  true,
				portainer.OperationDockerPing:    true,
				portainer.OperationDockerInfo:    true,
				portainer.OperationDockerVersion: true,
				portainer.OperationDockerEvents:  true,
				portainer.OperationDockerSystem:  true,

				// Portainer context-bound authorizations
				portainer.OperationPortainerStackList:    true,
				portainer.OperationPortainerStackInspect: true,
				portainer.OperationPortainerStackFile:    true,
				portainer.OperationPortainerWebhookList:  true,
			},
		}

		err = store.RoleService.CreateRole(readOnlyUserRole)
		if err != nil {
			return err
		}
	}

	return nil
}

// Close closes the BoltDB database.
func (store *Store) Close() error {
	if store.db != nil {
		return store.db.Close()
	}
	return nil
}

// MigrateData automatically migrate the data based on the DBVersion.
func (store *Store) MigrateData() error {
	if !store.checkForDataMigration {
		return store.VersionService.StoreDBVersion(portainer.DBVersion)
	}

	version, err := store.VersionService.DBVersion()
	if err == portainer.ErrObjectNotFound {
		version = 0
	} else if err != nil {
		return err
	}

	if version < portainer.DBVersion {
		migratorParams := &migrator.Parameters{
			DB:                     store.db,
			DatabaseVersion:        version,
			EndpointGroupService:   store.EndpointGroupService,
			EndpointService:        store.EndpointService,
			ExtensionService:       store.ExtensionService,
			ResourceControlService: store.ResourceControlService,
			SettingsService:        store.SettingsService,
			StackService:           store.StackService,
			TemplateService:        store.TemplateService,
			UserService:            store.UserService,
			VersionService:         store.VersionService,
			FileService:            store.fileService,
		}
		migrator := migrator.NewMigrator(migratorParams)

		log.Printf("Migrating database from version %v to %v.\n", version, portainer.DBVersion)
		err = migrator.Migrate()
		if err != nil {
			log.Printf("An error occurred during database migration: %s\n", err)
			return err
		}
	}

	return nil
}

func (store *Store) initServices() error {
	authorizationsetService, err := role.NewService(store.db)
	if err != nil {
		return err
	}
	store.RoleService = authorizationsetService

	dockerhubService, err := dockerhub.NewService(store.db)
	if err != nil {
		return err
	}
	store.DockerHubService = dockerhubService

	endpointgroupService, err := endpointgroup.NewService(store.db)
	if err != nil {
		return err
	}
	store.EndpointGroupService = endpointgroupService

	endpointService, err := endpoint.NewService(store.db)
	if err != nil {
		return err
	}
	store.EndpointService = endpointService

	extensionService, err := extension.NewService(store.db)
	if err != nil {
		return err
	}
	store.ExtensionService = extensionService

	registryService, err := registry.NewService(store.db)
	if err != nil {
		return err
	}
	store.RegistryService = registryService

	resourcecontrolService, err := resourcecontrol.NewService(store.db)
	if err != nil {
		return err
	}
	store.ResourceControlService = resourcecontrolService

	settingsService, err := settings.NewService(store.db)
	if err != nil {
		return err
	}
	store.SettingsService = settingsService

	stackService, err := stack.NewService(store.db)
	if err != nil {
		return err
	}
	store.StackService = stackService

	tagService, err := tag.NewService(store.db)
	if err != nil {
		return err
	}
	store.TagService = tagService

	teammembershipService, err := teammembership.NewService(store.db)
	if err != nil {
		return err
	}
	store.TeamMembershipService = teammembershipService

	teamService, err := team.NewService(store.db)
	if err != nil {
		return err
	}
	store.TeamService = teamService

	templateService, err := template.NewService(store.db)
	if err != nil {
		return err
	}
	store.TemplateService = templateService

	userService, err := user.NewService(store.db)
	if err != nil {
		return err
	}
	store.UserService = userService

	versionService, err := version.NewService(store.db)
	if err != nil {
		return err
	}
	store.VersionService = versionService

	webhookService, err := webhook.NewService(store.db)
	if err != nil {
		return err
	}
	store.WebhookService = webhookService

	scheduleService, err := schedule.NewService(store.db)
	if err != nil {
		return err
	}
	store.ScheduleService = scheduleService

	return nil
}
