package http

import (
	"time"

<<<<<<< HEAD
	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"
=======
	"github.com/portainer/portainer/api/http/handler/edgegroups"
	"github.com/portainer/portainer/api/http/handler/edgestacks"
	"github.com/portainer/portainer/api/http/handler/edgetemplates"
	"github.com/portainer/portainer/api/http/handler/endpointedge"
	"github.com/portainer/portainer/api/http/handler/support"
>>>>>>> origin/develop

	"github.com/portainer/portainer/api/kubernetes/cli"

	"net/http"
	"path/filepath"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker"
	"github.com/portainer/portainer/api/http/handler"
	"github.com/portainer/portainer/api/http/handler/auth"
	"github.com/portainer/portainer/api/http/handler/dockerhub"
	"github.com/portainer/portainer/api/http/handler/endpointgroups"
	"github.com/portainer/portainer/api/http/handler/endpointproxy"
	"github.com/portainer/portainer/api/http/handler/endpoints"
	"github.com/portainer/portainer/api/http/handler/extensions"
	"github.com/portainer/portainer/api/http/handler/file"
	"github.com/portainer/portainer/api/http/handler/motd"
	"github.com/portainer/portainer/api/http/handler/registries"
	"github.com/portainer/portainer/api/http/handler/resourcecontrols"
	"github.com/portainer/portainer/api/http/handler/roles"
	"github.com/portainer/portainer/api/http/handler/schedules"
	"github.com/portainer/portainer/api/http/handler/settings"
	"github.com/portainer/portainer/api/http/handler/stacks"
	"github.com/portainer/portainer/api/http/handler/status"
	"github.com/portainer/portainer/api/http/handler/support"
	"github.com/portainer/portainer/api/http/handler/tags"
	"github.com/portainer/portainer/api/http/handler/teammemberships"
	"github.com/portainer/portainer/api/http/handler/teams"
	"github.com/portainer/portainer/api/http/handler/templates"
	"github.com/portainer/portainer/api/http/handler/upload"
	"github.com/portainer/portainer/api/http/handler/users"
	"github.com/portainer/portainer/api/http/handler/webhooks"
	"github.com/portainer/portainer/api/http/handler/websocket"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/security"
)

// Server implements the portainer.Server interface
type Server struct {
<<<<<<< HEAD
	BindAddress             string
	AssetsPath              string
	AuthDisabled            bool
	EndpointManagement      bool
	Status                  *portainer.Status
	ReverseTunnelService    portainer.ReverseTunnelService
	ExtensionManager        portainer.ExtensionManager
	ComposeStackManager     portainer.ComposeStackManager
	SwarmStackManager       portainer.SwarmStackManager
	KubernetesDeployer      portainer.KubernetesDeployer
	CryptoService           portainer.CryptoService
	SignatureService        portainer.DigitalSignatureService
	JobScheduler            portainer.JobScheduler
	RoleService             portainer.RoleService
	DockerHubService        portainer.DockerHubService
	EndpointService         portainer.EndpointService
	EndpointGroupService    portainer.EndpointGroupService
	FileService             portainer.FileService
	GitService              portainer.GitService
	JWTService              portainer.JWTService
	LDAPService             portainer.LDAPService
	ExtensionService        portainer.ExtensionService
	RegistryService         portainer.RegistryService
	ResourceControlService  portainer.ResourceControlService
	ScheduleService         portainer.ScheduleService
	SettingsService         portainer.SettingsService
	StackService            portainer.StackService
	TagService              portainer.TagService
	TeamService             portainer.TeamService
	TeamMembershipService   portainer.TeamMembershipService
	TemplateService         portainer.TemplateService
	UserService             portainer.UserService
	WebhookService          portainer.WebhookService
	Handler                 *handler.Handler
	SSL                     bool
	SSLCert                 string
	SSLKey                  string
	DockerClientFactory     *docker.ClientFactory
	KubernetesClientFactory *cli.ClientFactory
	SnapshotManager         *portainer.SnapshotManager
	JobService              portainer.JobService
=======
	BindAddress          string
	AssetsPath           string
	Status               *portainer.Status
	ReverseTunnelService portainer.ReverseTunnelService
	ExtensionManager     portainer.ExtensionManager
	ComposeStackManager  portainer.ComposeStackManager
	CryptoService        portainer.CryptoService
	SignatureService     portainer.DigitalSignatureService
	JobScheduler         portainer.JobScheduler
	Snapshotter          portainer.Snapshotter
	FileService          portainer.FileService
	DataStore            portainer.DataStore
	GitService           portainer.GitService
	JWTService           portainer.JWTService
	LDAPService          portainer.LDAPService
	SwarmStackManager    portainer.SwarmStackManager
	Handler              *handler.Handler
	SSL                  bool
	SSLCert              string
	SSLKey               string
	DockerClientFactory  *docker.ClientFactory
	JobService           portainer.JobService
>>>>>>> origin/develop
}

// Start starts the HTTP server
func (server *Server) Start() error {
<<<<<<< HEAD
	kubernetesTokenCacheManager := kubernetes.NewTokenCacheManager()

	proxyManagerParameters := &proxy.ManagerParams{
		ResourceControlService:      server.ResourceControlService,
		UserService:                 server.UserService,
		TeamService:                 server.TeamService,
		TeamMembershipService:       server.TeamMembershipService,
		SettingsService:             server.SettingsService,
		RegistryService:             server.RegistryService,
		DockerHubService:            server.DockerHubService,
		SignatureService:            server.SignatureService,
		ReverseTunnelService:        server.ReverseTunnelService,
		ExtensionService:            server.ExtensionService,
		DockerClientFactory:         server.DockerClientFactory,
		KubernetesClientFactory:     server.KubernetesClientFactory,
		KubernetesTokenCacheManager: kubernetesTokenCacheManager,
	}
	proxyManager := proxy.NewManager(proxyManagerParameters)

	authorizationServiceParameters := &portainer.AuthorizationServiceParameters{
		EndpointService:       server.EndpointService,
		EndpointGroupService:  server.EndpointGroupService,
		RegistryService:       server.RegistryService,
		RoleService:           server.RoleService,
		TeamMembershipService: server.TeamMembershipService,
		UserService:           server.UserService,
	}
	authorizationService := portainer.NewAuthorizationService(authorizationServiceParameters)

	requestBouncerParameters := &security.RequestBouncerParams{
		JWTService:            server.JWTService,
		UserService:           server.UserService,
		TeamMembershipService: server.TeamMembershipService,
		EndpointService:       server.EndpointService,
		EndpointGroupService:  server.EndpointGroupService,
		ExtensionService:      server.ExtensionService,
		RBACExtensionURL:      proxyManager.GetExtensionURL(portainer.RBACExtension),
		AuthDisabled:          server.AuthDisabled,
	}
	requestBouncer := security.NewRequestBouncer(requestBouncerParameters)
=======
	proxyManager := proxy.NewManager(server.DataStore, server.SignatureService, server.ReverseTunnelService, server.DockerClientFactory)

	authorizationService := portainer.NewAuthorizationService(server.DataStore)

	rbacExtensionURL := proxyManager.GetExtensionURL(portainer.RBACExtension)
	requestBouncer := security.NewRequestBouncer(server.DataStore, server.JWTService, rbacExtensionURL)
>>>>>>> origin/develop

	rateLimiter := security.NewRateLimiter(10, 1*time.Second, 1*time.Hour)

	var authHandler = auth.NewHandler(requestBouncer, rateLimiter)
	authHandler.DataStore = server.DataStore
	authHandler.CryptoService = server.CryptoService
	authHandler.JWTService = server.JWTService
	authHandler.LDAPService = server.LDAPService
	authHandler.ProxyManager = proxyManager
	authHandler.AuthorizationService = authorizationService
	authHandler.KubernetesTokenCacheManager = kubernetesTokenCacheManager

	var roleHandler = roles.NewHandler(requestBouncer)
	roleHandler.DataStore = server.DataStore

	var dockerHubHandler = dockerhub.NewHandler(requestBouncer)
	dockerHubHandler.DataStore = server.DataStore

	var edgeGroupsHandler = edgegroups.NewHandler(requestBouncer)
	edgeGroupsHandler.DataStore = server.DataStore

	var edgeStacksHandler = edgestacks.NewHandler(requestBouncer)
	edgeStacksHandler.DataStore = server.DataStore
	edgeStacksHandler.FileService = server.FileService
	edgeStacksHandler.GitService = server.GitService

	var edgeTemplatesHandler = edgetemplates.NewHandler(requestBouncer)
	edgeTemplatesHandler.DataStore = server.DataStore

	var endpointHandler = endpoints.NewHandler(requestBouncer)
	endpointHandler.DataStore = server.DataStore
	endpointHandler.AuthorizationService = authorizationService
	endpointHandler.FileService = server.FileService
<<<<<<< HEAD
	endpointHandler.ProxyManager = proxyManager
	endpointHandler.SnapshotManager = server.SnapshotManager
=======
>>>>>>> origin/develop
	endpointHandler.JobService = server.JobService
	endpointHandler.ProxyManager = proxyManager
	endpointHandler.ReverseTunnelService = server.ReverseTunnelService
	endpointHandler.Snapshotter = server.Snapshotter

	var endpointEdgeHandler = endpointedge.NewHandler(requestBouncer)
	endpointEdgeHandler.DataStore = server.DataStore
	endpointEdgeHandler.FileService = server.FileService

	var endpointGroupHandler = endpointgroups.NewHandler(requestBouncer)
	endpointGroupHandler.DataStore = server.DataStore
	endpointGroupHandler.AuthorizationService = authorizationService

	var endpointProxyHandler = endpointproxy.NewHandler(requestBouncer)
	endpointProxyHandler.DataStore = server.DataStore
	endpointProxyHandler.ProxyManager = proxyManager
	endpointProxyHandler.ReverseTunnelService = server.ReverseTunnelService

	var fileHandler = file.NewHandler(filepath.Join(server.AssetsPath, "public"))

	var motdHandler = motd.NewHandler(requestBouncer)

	var extensionHandler = extensions.NewHandler(requestBouncer)
	extensionHandler.DataStore = server.DataStore
	extensionHandler.ExtensionManager = server.ExtensionManager
	extensionHandler.AuthorizationService = authorizationService

	var registryHandler = registries.NewHandler(requestBouncer)
	registryHandler.DataStore = server.DataStore
	registryHandler.FileService = server.FileService
	registryHandler.ProxyManager = proxyManager

	var resourceControlHandler = resourcecontrols.NewHandler(requestBouncer)
	resourceControlHandler.DataStore = server.DataStore

	var schedulesHandler = schedules.NewHandler(requestBouncer)
	schedulesHandler.DataStore = server.DataStore
	schedulesHandler.FileService = server.FileService
	schedulesHandler.JobService = server.JobService
	schedulesHandler.JobScheduler = server.JobScheduler
	schedulesHandler.ReverseTunnelService = server.ReverseTunnelService

	var settingsHandler = settings.NewHandler(requestBouncer)
	settingsHandler.AuthorizationService = authorizationService
	settingsHandler.DataStore = server.DataStore
	settingsHandler.FileService = server.FileService
	settingsHandler.JobScheduler = server.JobScheduler
	settingsHandler.JWTService = server.JWTService
	settingsHandler.LDAPService = server.LDAPService

	var stackHandler = stacks.NewHandler(requestBouncer)
	stackHandler.DataStore = server.DataStore
	stackHandler.FileService = server.FileService
	stackHandler.SwarmStackManager = server.SwarmStackManager
	stackHandler.ComposeStackManager = server.ComposeStackManager
	stackHandler.KubernetesDeployer = server.KubernetesDeployer
	stackHandler.GitService = server.GitService

	var tagHandler = tags.NewHandler(requestBouncer)
	tagHandler.DataStore = server.DataStore

	var teamHandler = teams.NewHandler(requestBouncer)
	teamHandler.DataStore = server.DataStore
	teamHandler.AuthorizationService = authorizationService

	var teamMembershipHandler = teammemberships.NewHandler(requestBouncer)
	teamMembershipHandler.DataStore = server.DataStore
	teamMembershipHandler.AuthorizationService = authorizationService

	var statusHandler = status.NewHandler(requestBouncer, server.Status)

	var supportHandler = support.NewHandler(requestBouncer)

	var templatesHandler = templates.NewHandler(requestBouncer)
	templatesHandler.DataStore = server.DataStore

	var uploadHandler = upload.NewHandler(requestBouncer)
	uploadHandler.FileService = server.FileService

	var userHandler = users.NewHandler(requestBouncer, rateLimiter)
	userHandler.DataStore = server.DataStore
	userHandler.CryptoService = server.CryptoService
	userHandler.AuthorizationService = authorizationService

	var websocketHandler = websocket.NewHandler(requestBouncer)
	websocketHandler.DataStore = server.DataStore
	websocketHandler.SignatureService = server.SignatureService
	websocketHandler.ReverseTunnelService = server.ReverseTunnelService
	websocketHandler.KubernetesClientFactory = server.KubernetesClientFactory

	var webhookHandler = webhooks.NewHandler(requestBouncer)
	webhookHandler.DataStore = server.DataStore
	webhookHandler.DockerClientFactory = server.DockerClientFactory

	server.Handler = &handler.Handler{
		RoleHandler:            roleHandler,
		AuthHandler:            authHandler,
		DockerHubHandler:       dockerHubHandler,
		EdgeGroupsHandler:      edgeGroupsHandler,
		EdgeStacksHandler:      edgeStacksHandler,
		EdgeTemplatesHandler:   edgeTemplatesHandler,
		EndpointGroupHandler:   endpointGroupHandler,
		EndpointHandler:        endpointHandler,
		EndpointEdgeHandler:    endpointEdgeHandler,
		EndpointProxyHandler:   endpointProxyHandler,
		FileHandler:            fileHandler,
		MOTDHandler:            motdHandler,
		ExtensionHandler:       extensionHandler,
		RegistryHandler:        registryHandler,
		ResourceControlHandler: resourceControlHandler,
		SettingsHandler:        settingsHandler,
		StatusHandler:          statusHandler,
		StackHandler:           stackHandler,
		SupportHandler:         supportHandler,
		TagHandler:             tagHandler,
		TeamHandler:            teamHandler,
		TeamMembershipHandler:  teamMembershipHandler,
		TemplatesHandler:       templatesHandler,
		UploadHandler:          uploadHandler,
		UserHandler:            userHandler,
		WebSocketHandler:       websocketHandler,
		WebhookHandler:         webhookHandler,
		SchedulesHanlder:       schedulesHandler,
	}

	if server.SSL {
		return http.ListenAndServeTLS(server.BindAddress, server.SSLCert, server.SSLKey, server.Handler)
	}
	return http.ListenAndServe(server.BindAddress, server.Handler)
}
