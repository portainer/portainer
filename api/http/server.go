package http

import (
	"bytes"
	"errors"
	"log"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/orcaman/concurrent-map"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/docker"
	"github.com/portainer/portainer/http/handler"
	"github.com/portainer/portainer/http/handler/auth"
	"github.com/portainer/portainer/http/handler/dockerhub"
	"github.com/portainer/portainer/http/handler/endpointgroups"
	"github.com/portainer/portainer/http/handler/endpointproxy"
	"github.com/portainer/portainer/http/handler/endpoints"
	"github.com/portainer/portainer/http/handler/file"
	"github.com/portainer/portainer/http/handler/motd"
	"github.com/portainer/portainer/http/handler/plugins"
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
	"github.com/portainer/portainer/http/handler/webhooks"
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
	JobScheduler           portainer.JobScheduler
	Snapshotter            portainer.Snapshotter
	DockerHubService       portainer.DockerHubService
	EndpointService        portainer.EndpointService
	EndpointGroupService   portainer.EndpointGroupService
	FileService            portainer.FileService
	GitService             portainer.GitService
	JWTService             portainer.JWTService
	LDAPService            portainer.LDAPService
	PluginService          portainer.PluginService
	RegistryService        portainer.RegistryService
	ResourceControlService portainer.ResourceControlService
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
}

// TODO: relocate
func initPlugins(pluginService portainer.PluginService, proxyManager *proxy.Manager, pluginProcesses *cmap.ConcurrentMap) {

	plugins, err := pluginService.Plugins()
	if err != nil {
		log.Printf("Plugin init error: \n", err)
		return
	}

	for _, plugin := range plugins {
		err := startPlugin(&plugin, proxyManager, pluginProcesses)
		if err != nil {
			log.Printf("Plugin init error: \n", err)
			return
		}
	}

}

func startPlugin(plugin *portainer.Plugin, proxyManager *proxy.Manager, pluginProcesses *cmap.ConcurrentMap) error {

	// TODO: switch case on plugin identifier to download/enable correct plugin
	switch plugin.ID {
	case portainer.RegistryManagementPlugin:
		return startRegistryManagementPlugin(plugin, proxyManager, pluginProcesses)
	default:
		return errors.New("Unsupported plugin identifier")
	}

	return nil
}

func startRegistryManagementPlugin(plugin *portainer.Plugin, proxyManager *proxy.Manager, pluginProcesses *cmap.ConcurrentMap) error {
	// TODO: if license check fails, need to be updated to use flags
	// should probably download and use a specific license-checker binary

	licenseValidationCommand := exec.Command("/data/bin/plugin-registry-management-linux-amd64-1.0.0", "-license", plugin.License, "-check")
	cmdOutput := &bytes.Buffer{}
	licenseValidationCommand.Stdout = cmdOutput

	err := licenseValidationCommand.Run()
	if err != nil {
		return portainer.Error("Invalid license")
	}

	output := string(cmdOutput.Bytes())
	licenseDetails := strings.Split(output, "|")
	plugin.LicenseCompany = licenseDetails[0]
	plugin.LicenseExpiration = licenseDetails[1]
	plugin.Version = licenseDetails[2]

	// syscall.Exec replaces the process, ForkExec could be tried?
	// Also should be relocated to another package
	// err = syscall.ForkExec("/plugins/plugin-registry-management", []string{"plugin-registry-management"}, os.Environ())
	cmd := exec.Command("/data/bin/plugin-registry-management-linux-amd64-1.0.0", plugin.License)

	// cmd.Start will not share logs with the main Portainer container.
	err = cmd.Start()
	if err != nil {
		return err
	}

	pluginProcesses.Set(strconv.Itoa(int(plugin.ID)), cmd)

	return proxyManager.CreatePluginProxy(plugin.ID)
}

// Start starts the HTTP server
func (server *Server) Start() error {
	requestBouncerParameters := &security.RequestBouncerParams{
		JWTService:            server.JWTService,
		UserService:           server.UserService,
		TeamMembershipService: server.TeamMembershipService,
		EndpointGroupService:  server.EndpointGroupService,
		AuthDisabled:          server.AuthDisabled,
	}
	requestBouncer := security.NewRequestBouncer(requestBouncerParameters)
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

	// TODO: relocate to a service ? ProcessService?
	pluginProcesses := cmap.New()
	go initPlugins(server.PluginService, proxyManager, &pluginProcesses)

	var authHandler = auth.NewHandler(requestBouncer, rateLimiter, server.AuthDisabled)
	authHandler.UserService = server.UserService
	authHandler.CryptoService = server.CryptoService
	authHandler.JWTService = server.JWTService
	authHandler.LDAPService = server.LDAPService
	authHandler.SettingsService = server.SettingsService
	authHandler.TeamService = server.TeamService
	authHandler.TeamMembershipService = server.TeamMembershipService

	var dockerHubHandler = dockerhub.NewHandler(requestBouncer)
	dockerHubHandler.DockerHubService = server.DockerHubService

	var endpointHandler = endpoints.NewHandler(requestBouncer, server.EndpointManagement)
	endpointHandler.EndpointService = server.EndpointService
	endpointHandler.EndpointGroupService = server.EndpointGroupService
	endpointHandler.FileService = server.FileService
	endpointHandler.ProxyManager = proxyManager
	endpointHandler.Snapshotter = server.Snapshotter

	var endpointGroupHandler = endpointgroups.NewHandler(requestBouncer)
	endpointGroupHandler.EndpointGroupService = server.EndpointGroupService
	endpointGroupHandler.EndpointService = server.EndpointService

	var endpointProxyHandler = endpointproxy.NewHandler(requestBouncer)
	endpointProxyHandler.EndpointService = server.EndpointService
	endpointProxyHandler.ProxyManager = proxyManager

	var fileHandler = file.NewHandler(filepath.Join(server.AssetsPath, "public"))

	var motdHandler = motd.NewHandler(requestBouncer)

	var pluginHandler = plugins.NewHandler(requestBouncer)
	pluginHandler.PluginService = server.PluginService
	pluginHandler.FileService = server.FileService
	pluginHandler.ProxyManager = proxyManager
	pluginHandler.PluginProcesses = &pluginProcesses

	var registryHandler = registries.NewHandler(requestBouncer)
	registryHandler.RegistryService = server.RegistryService
	registryHandler.FileService = server.FileService
	registryHandler.ProxyManager = proxyManager

	var resourceControlHandler = resourcecontrols.NewHandler(requestBouncer)
	resourceControlHandler.ResourceControlService = server.ResourceControlService

	var settingsHandler = settings.NewHandler(requestBouncer)
	settingsHandler.SettingsService = server.SettingsService
	settingsHandler.LDAPService = server.LDAPService
	settingsHandler.FileService = server.FileService
	settingsHandler.JobScheduler = server.JobScheduler

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

	var tagHandler = tags.NewHandler(requestBouncer)
	tagHandler.TagService = server.TagService

	var teamHandler = teams.NewHandler(requestBouncer)
	teamHandler.TeamService = server.TeamService
	teamHandler.TeamMembershipService = server.TeamMembershipService

	var teamMembershipHandler = teammemberships.NewHandler(requestBouncer)
	teamMembershipHandler.TeamMembershipService = server.TeamMembershipService
	var statusHandler = status.NewHandler(requestBouncer, server.Status)

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

	var websocketHandler = websocket.NewHandler(requestBouncer)
	websocketHandler.EndpointService = server.EndpointService
	websocketHandler.SignatureService = server.SignatureService

	var webhookHandler = webhooks.NewHandler(requestBouncer)
	webhookHandler.WebhookService = server.WebhookService
	webhookHandler.EndpointService = server.EndpointService
	webhookHandler.DockerClientFactory = server.DockerClientFactory

	server.Handler = &handler.Handler{
		AuthHandler:            authHandler,
		DockerHubHandler:       dockerHubHandler,
		EndpointGroupHandler:   endpointGroupHandler,
		EndpointHandler:        endpointHandler,
		EndpointProxyHandler:   endpointProxyHandler,
		FileHandler:            fileHandler,
		MOTDHandler:            motdHandler,
		PluginHandler:          pluginHandler,
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
		WebhookHandler:         webhookHandler,
	}

	if server.SSL {
		return http.ListenAndServeTLS(server.BindAddress, server.SSLCert, server.SSLKey, server.Handler)
	}
	return http.ListenAndServe(server.BindAddress, server.Handler)
}
