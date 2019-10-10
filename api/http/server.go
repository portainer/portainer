package http

import (
	"time"

	"github.com/portainer/portainer/api/http/handler/support"

	"github.com/portainer/portainer/api/http/handler/roles"

	"github.com/portainer/portainer/api"
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
	"github.com/portainer/portainer/api/http/handler/schedules"
	"github.com/portainer/portainer/api/http/handler/settings"
	"github.com/portainer/portainer/api/http/handler/stacks"
	"github.com/portainer/portainer/api/http/handler/status"
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

	"net/http"
	"path/filepath"
)

// Server implements the portainer.Server interface
type Server struct {
	BindAddress            string
	AssetsPath             string
	AuthDisabled           bool
	EndpointManagement     bool
	Status                 *portainer.Status
	ReverseTunnelService   portainer.ReverseTunnelService
	ExtensionManager       portainer.ExtensionManager
	ComposeStackManager    portainer.ComposeStackManager
	CryptoService          portainer.CryptoService
	SignatureService       portainer.DigitalSignatureService
	JobScheduler           portainer.JobScheduler
	Snapshotter            portainer.Snapshotter
	RoleService            portainer.RoleService
	DockerHubService       portainer.DockerHubService
	EndpointService        portainer.EndpointService
	EndpointGroupService   portainer.EndpointGroupService
	FileService            portainer.FileService
	GitService             portainer.GitService
	JWTService             portainer.JWTService
	LDAPService            portainer.LDAPService
	ExtensionService       portainer.ExtensionService
	RegistryService        portainer.RegistryService
	ResourceControlService portainer.ResourceControlService
	ScheduleService        portainer.ScheduleService
	SettingsService        portainer.SettingsService
	StackService           portainer.StackService
	SwarmStackManager      portainer.SwarmStackManager
	TagService             portainer.TagService
	TeamService            portainer.TeamService
	TeamMembershipService  portainer.TeamMembershipService
	TemplateService        portainer.TemplateService
	UserService            portainer.UserService
	WebhookService         portainer.WebhookService
	Handler                *handler.Handler
	SSL                    bool
	SSLCert                string
	SSLKey                 string
	DockerClientFactory    *docker.ClientFactory
	JobService             portainer.JobService
}

// Start starts the HTTP server
func (server *Server) Start() error {
	proxyManagerParameters := &proxy.ManagerParams{
		ResourceControlService: server.ResourceControlService,
		UserService:            server.UserService,
		TeamMembershipService:  server.TeamMembershipService,
		SettingsService:        server.SettingsService,
		RegistryService:        server.RegistryService,
		DockerHubService:       server.DockerHubService,
		SignatureService:       server.SignatureService,
		ReverseTunnelService:   server.ReverseTunnelService,
		ExtensionService:       server.ExtensionService,
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

	rateLimiter := security.NewRateLimiter(10, 1*time.Second, 1*time.Hour)

	var authHandler = auth.NewHandler(requestBouncer, rateLimiter, server.AuthDisabled)
	authHandler.UserService = server.UserService
	authHandler.CryptoService = server.CryptoService
	authHandler.JWTService = server.JWTService
	authHandler.LDAPService = server.LDAPService
	authHandler.SettingsService = server.SettingsService
	authHandler.TeamService = server.TeamService
	authHandler.TeamMembershipService = server.TeamMembershipService
	authHandler.ExtensionService = server.ExtensionService
	authHandler.EndpointService = server.EndpointService
	authHandler.EndpointGroupService = server.EndpointGroupService
	authHandler.RoleService = server.RoleService
	authHandler.ProxyManager = proxyManager

	var roleHandler = roles.NewHandler(requestBouncer)
	roleHandler.RoleService = server.RoleService

	var dockerHubHandler = dockerhub.NewHandler(requestBouncer)
	dockerHubHandler.DockerHubService = server.DockerHubService

	var endpointHandler = endpoints.NewHandler(requestBouncer, server.EndpointManagement)
	endpointHandler.EndpointService = server.EndpointService
	endpointHandler.EndpointGroupService = server.EndpointGroupService
	endpointHandler.FileService = server.FileService
	endpointHandler.ProxyManager = proxyManager
	endpointHandler.Snapshotter = server.Snapshotter
	endpointHandler.JobService = server.JobService
	endpointHandler.ReverseTunnelService = server.ReverseTunnelService
	endpointHandler.SettingsService = server.SettingsService
	endpointHandler.AuthorizationService = authorizationService

	var endpointGroupHandler = endpointgroups.NewHandler(requestBouncer)
	endpointGroupHandler.EndpointGroupService = server.EndpointGroupService
	endpointGroupHandler.EndpointService = server.EndpointService
	endpointGroupHandler.AuthorizationService = authorizationService

	var endpointProxyHandler = endpointproxy.NewHandler(requestBouncer)
	endpointProxyHandler.EndpointService = server.EndpointService
	endpointProxyHandler.ProxyManager = proxyManager
	endpointProxyHandler.SettingsService = server.SettingsService
	endpointProxyHandler.ReverseTunnelService = server.ReverseTunnelService

	var fileHandler = file.NewHandler(filepath.Join(server.AssetsPath, "public"))

	var motdHandler = motd.NewHandler(requestBouncer)

	var extensionHandler = extensions.NewHandler(requestBouncer)
	extensionHandler.ExtensionService = server.ExtensionService
	extensionHandler.ExtensionManager = server.ExtensionManager
	extensionHandler.EndpointGroupService = server.EndpointGroupService
	extensionHandler.EndpointService = server.EndpointService
	extensionHandler.RegistryService = server.RegistryService
	extensionHandler.AuthorizationService = authorizationService

	var registryHandler = registries.NewHandler(requestBouncer)
	registryHandler.RegistryService = server.RegistryService
	registryHandler.ExtensionService = server.ExtensionService
	registryHandler.FileService = server.FileService
	registryHandler.ProxyManager = proxyManager

	var resourceControlHandler = resourcecontrols.NewHandler(requestBouncer)
	resourceControlHandler.ResourceControlService = server.ResourceControlService

	var schedulesHandler = schedules.NewHandler(requestBouncer)
	schedulesHandler.ScheduleService = server.ScheduleService
	schedulesHandler.EndpointService = server.EndpointService
	schedulesHandler.FileService = server.FileService
	schedulesHandler.JobService = server.JobService
	schedulesHandler.JobScheduler = server.JobScheduler
	schedulesHandler.SettingsService = server.SettingsService
	schedulesHandler.ReverseTunnelService = server.ReverseTunnelService

	var settingsHandler = settings.NewHandler(requestBouncer)
	settingsHandler.SettingsService = server.SettingsService
	settingsHandler.LDAPService = server.LDAPService
	settingsHandler.FileService = server.FileService
	settingsHandler.JobScheduler = server.JobScheduler
	settingsHandler.ScheduleService = server.ScheduleService
	settingsHandler.RoleService = server.RoleService
	settingsHandler.ExtensionService = server.ExtensionService
	settingsHandler.AuthorizationService = authorizationService

	var stackHandler = stacks.NewHandler(requestBouncer)
	stackHandler.FileService = server.FileService
	stackHandler.StackService = server.StackService
	stackHandler.EndpointService = server.EndpointService
	stackHandler.ResourceControlService = server.ResourceControlService
	stackHandler.SwarmStackManager = server.SwarmStackManager
	stackHandler.ComposeStackManager = server.ComposeStackManager
	stackHandler.GitService = server.GitService
	stackHandler.RegistryService = server.RegistryService
	stackHandler.DockerHubService = server.DockerHubService
	stackHandler.SettingsService = server.SettingsService

	var tagHandler = tags.NewHandler(requestBouncer)
	tagHandler.TagService = server.TagService

	var teamHandler = teams.NewHandler(requestBouncer)
	teamHandler.TeamService = server.TeamService
	teamHandler.TeamMembershipService = server.TeamMembershipService
	teamHandler.AuthorizationService = authorizationService

	var teamMembershipHandler = teammemberships.NewHandler(requestBouncer)
	teamMembershipHandler.TeamMembershipService = server.TeamMembershipService
	teamMembershipHandler.AuthorizationService = authorizationService

	var statusHandler = status.NewHandler(requestBouncer, server.Status)

	var supportHandler = support.NewHandler(requestBouncer)

	var templatesHandler = templates.NewHandler(requestBouncer)
	templatesHandler.TemplateService = server.TemplateService
	templatesHandler.SettingsService = server.SettingsService

	var uploadHandler = upload.NewHandler(requestBouncer)
	uploadHandler.FileService = server.FileService

	var userHandler = users.NewHandler(requestBouncer, rateLimiter)
	userHandler.UserService = server.UserService
	userHandler.TeamService = server.TeamService
	userHandler.TeamMembershipService = server.TeamMembershipService
	userHandler.CryptoService = server.CryptoService
	userHandler.ResourceControlService = server.ResourceControlService
	userHandler.SettingsService = server.SettingsService
	userHandler.AuthorizationService = authorizationService

	var websocketHandler = websocket.NewHandler(requestBouncer)
	websocketHandler.EndpointService = server.EndpointService
	websocketHandler.SignatureService = server.SignatureService
	websocketHandler.ReverseTunnelService = server.ReverseTunnelService

	var webhookHandler = webhooks.NewHandler(requestBouncer)
	webhookHandler.WebhookService = server.WebhookService
	webhookHandler.EndpointService = server.EndpointService
	webhookHandler.DockerClientFactory = server.DockerClientFactory

	server.Handler = &handler.Handler{
		RoleHandler:            roleHandler,
		AuthHandler:            authHandler,
		DockerHubHandler:       dockerHubHandler,
		EndpointGroupHandler:   endpointGroupHandler,
		EndpointHandler:        endpointHandler,
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
