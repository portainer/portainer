package http

import (
	"time"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/handler"
	"github.com/portainer/portainer/http/handler/auth"
	"github.com/portainer/portainer/http/handler/dockerhub"
	"github.com/portainer/portainer/http/handler/endpointgroups"
	"github.com/portainer/portainer/http/handler/endpointproxy"
	"github.com/portainer/portainer/http/handler/endpoints"
	"github.com/portainer/portainer/http/handler/file"
	"github.com/portainer/portainer/http/handler/registries"
	"github.com/portainer/portainer/http/handler/resourcecontrols"
	"github.com/portainer/portainer/http/handler/settings"
	"github.com/portainer/portainer/http/handler/stacks"
	"github.com/portainer/portainer/http/handler/status"
	"github.com/portainer/portainer/http/handler/tags"
	"github.com/portainer/portainer/http/handler/teammemberships"
	"github.com/portainer/portainer/http/handler/teams"
	"github.com/portainer/portainer/http/handler/templates"
	"github.com/portainer/portainer/http/handler/upload"
	"github.com/portainer/portainer/http/handler/users"
	"github.com/portainer/portainer/http/handler/websocket"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/security"

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
	ComposeStackManager    portainer.ComposeStackManager
	CryptoService          portainer.CryptoService
	SignatureService       portainer.DigitalSignatureService
	DockerHubService       portainer.DockerHubService
	EndpointService        portainer.EndpointService
	EndpointGroupService   portainer.EndpointGroupService
	FileService            portainer.FileService
	GitService             portainer.GitService
	JWTService             portainer.JWTService
	LDAPService            portainer.LDAPService
	RegistryService        portainer.RegistryService
	ResourceControlService portainer.ResourceControlService
	SettingsService        portainer.SettingsService
	StackService           portainer.StackService
	SwarmStackManager      portainer.SwarmStackManager
	TagService             portainer.TagService
	TeamService            portainer.TeamService
	TeamMembershipService  portainer.TeamMembershipService
	UserService            portainer.UserService
	Handler                *handler.Handler
	SSL                    bool
	SSLCert                string
	SSLKey                 string
}

// Start starts the HTTP server
func (server *Server) Start() error {
	requestBouncer := security.NewRequestBouncer(server.JWTService, server.UserService, server.TeamMembershipService, server.AuthDisabled)
	proxyManagerParameters := &proxy.ManagerParams{
		ResourceControlService: server.ResourceControlService,
		TeamMembershipService:  server.TeamMembershipService,
		SettingsService:        server.SettingsService,
		RegistryService:        server.RegistryService,
		DockerHubService:       server.DockerHubService,
		SignatureService:       server.SignatureService,
	}
	proxyManager := proxy.NewManager(proxyManagerParameters)
	rateLimiter := security.NewRateLimiter(10, 1*time.Second, 1*time.Hour)

	var authHandler = auth.NewHandler(requestBouncer, rateLimiter, server.AuthDisabled)
	authHandler.UserService = server.UserService
	authHandler.CryptoService = server.CryptoService
	authHandler.JWTService = server.JWTService
	authHandler.LDAPService = server.LDAPService
	authHandler.SettingsService = server.SettingsService

	var dockerHubHandler = dockerhub.NewHandler(requestBouncer)
	dockerHubHandler.DockerHubService = server.DockerHubService

	var endpointHandler = endpoints.NewHandler(requestBouncer, server.EndpointManagement)
	endpointHandler.EndpointService = server.EndpointService
	endpointHandler.EndpointGroupService = server.EndpointGroupService
	endpointHandler.FileService = server.FileService
	endpointHandler.ProxyManager = proxyManager

	var endpointGroupHandler = endpointgroups.NewHandler(requestBouncer)
	endpointGroupHandler.EndpointGroupService = server.EndpointGroupService
	endpointGroupHandler.EndpointService = server.EndpointService

	var endpointProxyHandler = endpointproxy.NewHandler(requestBouncer)
	endpointProxyHandler.EndpointService = server.EndpointService
	endpointProxyHandler.EndpointGroupService = server.EndpointGroupService
	endpointProxyHandler.TeamMembershipService = server.TeamMembershipService
	endpointProxyHandler.ProxyManager = proxyManager

	var fileHandler = file.NewHandler(filepath.Join(server.AssetsPath, "public"))

	var registryHandler = registries.NewHandler(requestBouncer)
	registryHandler.RegistryService = server.RegistryService

	var resourceControlHandler = resourcecontrols.NewHandler(requestBouncer)
	resourceControlHandler.ResourceControlService = server.ResourceControlService

	var settingsHandler = settings.NewHandler(requestBouncer)
	settingsHandler.SettingsService = server.SettingsService
	settingsHandler.LDAPService = server.LDAPService
	settingsHandler.FileService = server.FileService

	var stackHandler = stacks.NewHandler(requestBouncer)
	stackHandler.FileService = server.FileService
	stackHandler.StackService = server.StackService
	stackHandler.EndpointService = server.EndpointService
	stackHandler.EndpointGroupService = server.EndpointGroupService
	stackHandler.TeamMembershipService = server.TeamMembershipService
	stackHandler.ResourceControlService = server.ResourceControlService
	stackHandler.SwarmStackManager = server.SwarmStackManager
	stackHandler.ComposeStackManager = server.ComposeStackManager
	stackHandler.GitService = server.GitService
	stackHandler.RegistryService = server.RegistryService
	stackHandler.DockerHubService = server.DockerHubService

	var tagHandler = tags.NewHandler(requestBouncer)
	tagHandler.TagService = server.TagService

	var teamHandler = teams.NewHandler(requestBouncer)
	teamHandler.TeamService = server.TeamService
	teamHandler.TeamMembershipService = server.TeamMembershipService

	var teamMembershipHandler = teammemberships.NewHandler(requestBouncer)
	teamMembershipHandler.TeamMembershipService = server.TeamMembershipService
	var statusHandler = status.NewHandler(requestBouncer, server.Status)

	var templatesHandler = templates.NewHandler(requestBouncer)
	templatesHandler.SettingsService = server.SettingsService

	var uploadHandler = upload.NewHandler(requestBouncer)
	uploadHandler.FileService = server.FileService

	var userHandler = users.NewHandler(requestBouncer)
	userHandler.UserService = server.UserService
	userHandler.TeamService = server.TeamService
	userHandler.TeamMembershipService = server.TeamMembershipService
	userHandler.CryptoService = server.CryptoService
	userHandler.ResourceControlService = server.ResourceControlService
	userHandler.SettingsService = server.SettingsService

	var websocketHandler = websocket.NewHandler()
	websocketHandler.EndpointService = server.EndpointService
	websocketHandler.SignatureService = server.SignatureService

	server.Handler = &handler.Handler{
		AuthHandler:            authHandler,
		DockerHubHandler:       dockerHubHandler,
		EndpointGroupHandler:   endpointGroupHandler,
		EndpointHandler:        endpointHandler,
		EndpointProxyHandler:   endpointProxyHandler,
		FileHandler:            fileHandler,
		RegistryHandler:        registryHandler,
		ResourceControlHandler: resourceControlHandler,
		SettingsHandler:        settingsHandler,
		StatusHandler:          statusHandler,
		StackHandler:           stackHandler,
		TagHandler:             tagHandler,
		TeamHandler:            teamHandler,
		TeamMembershipHandler:  teamMembershipHandler,
		TemplatesHandler:       templatesHandler,
		UploadHandler:          uploadHandler,
		UserHandler:            userHandler,
		WebSocketHandler:       websocketHandler,
	}

	if server.SSL {
		return http.ListenAndServeTLS(server.BindAddress, server.SSLCert, server.SSLKey, server.Handler)
	}
	return http.ListenAndServe(server.BindAddress, server.Handler)
}
