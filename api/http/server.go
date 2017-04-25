package http

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/handler"
	"github.com/portainer/portainer/http/middleware"
	"github.com/portainer/portainer/http/proxy"

	"net/http"
)

// Server implements the portainer.Server interface
type Server struct {
	BindAddress            string
	AssetsPath             string
	AuthDisabled           bool
	EndpointManagement     bool
	UserService            portainer.UserService
	TeamService            portainer.TeamService
	EndpointService        portainer.EndpointService
	ResourceControlService portainer.ResourceControlService
	CryptoService          portainer.CryptoService
	JWTService             portainer.JWTService
	FileService            portainer.FileService
	Settings               *portainer.Settings
	TemplatesURL           string
	Handler                *handler.Handler
	SSL                    bool
	SSLCert                string
	SSLKey                 string
}

// Start starts the HTTP server
func (server *Server) Start() error {
	middlewareService := middleware.NewService(server.JWTService, server.AuthDisabled)
	proxyService := proxy.NewService(server.ResourceControlService, server.TeamService)

	var authHandler = handler.NewAuthHandler(middlewareService, server.AuthDisabled)
	authHandler.UserService = server.UserService
	authHandler.CryptoService = server.CryptoService
	authHandler.JWTService = server.JWTService
	var userHandler = handler.NewUserHandler(middlewareService)
	userHandler.UserService = server.UserService
	userHandler.CryptoService = server.CryptoService
	userHandler.ResourceControlService = server.ResourceControlService
	var teamHandler = handler.NewTeamHandler(middlewareService)
	teamHandler.TeamService = server.TeamService
	var settingsHandler = handler.NewSettingsHandler(middlewareService, server.Settings)
	var templatesHandler = handler.NewTemplatesHandler(middlewareService, server.TemplatesURL)
	var dockerHandler = handler.NewDockerHandler(middlewareService)
	dockerHandler.EndpointService = server.EndpointService
	dockerHandler.TeamService = server.TeamService
	dockerHandler.ProxyService = proxyService
	var websocketHandler = handler.NewWebSocketHandler()
	websocketHandler.EndpointService = server.EndpointService
	var endpointHandler = handler.NewEndpointHandler(middlewareService, server.EndpointManagement)
	endpointHandler.EndpointService = server.EndpointService
	endpointHandler.FileService = server.FileService
	endpointHandler.TeamService = server.TeamService
	endpointHandler.ProxyService = proxyService
	var resourceHandler = handler.NewResourceHandler(middlewareService)
	resourceHandler.ResourceControlService = server.ResourceControlService
	var uploadHandler = handler.NewUploadHandler(middlewareService)
	uploadHandler.FileService = server.FileService
	var fileHandler = handler.NewFileHandler(server.AssetsPath)

	server.Handler = &handler.Handler{
		AuthHandler:      authHandler,
		UserHandler:      userHandler,
		TeamHandler:      teamHandler,
		EndpointHandler:  endpointHandler,
		ResourceHandler:  resourceHandler,
		SettingsHandler:  settingsHandler,
		TemplatesHandler: templatesHandler,
		DockerHandler:    dockerHandler,
		WebSocketHandler: websocketHandler,
		FileHandler:      fileHandler,
		UploadHandler:    uploadHandler,
	}

	if server.SSL {
		return http.ListenAndServeTLS(server.BindAddress, server.SSLCert, server.SSLKey, server.Handler)
	}
	return http.ListenAndServe(server.BindAddress, server.Handler)
}
