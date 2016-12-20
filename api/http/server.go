package http

import (
	"github.com/portainer/portainer"

	"net/http"
)

// Server implements the portainer.Server interface
type Server struct {
	BindAddress     string
	AssetsPath      string
	UserService     portainer.UserService
	EndpointService portainer.EndpointService
	CryptoService   portainer.CryptoService
	JWTService      portainer.JWTService
	Settings        *portainer.Settings
	TemplatesURL    string
	ActiveEndpoint  *portainer.Endpoint
}

// Start starts the HTTP server
func (server *Server) Start() error {
	middleWareService := &middleWareService{
		jwtService: server.JWTService,
	}

	var authHandler = NewAuthHandler()
	authHandler.UserService = server.UserService
	authHandler.CryptoService = server.CryptoService
	authHandler.JWTService = server.JWTService
	var userHandler = NewUserHandler(middleWareService)
	userHandler.UserService = server.UserService
	userHandler.CryptoService = server.CryptoService
	var settingsHandler = NewSettingsHandler(middleWareService)
	settingsHandler.settings = server.Settings
	var templatesHandler = NewTemplatesHandler(middleWareService)
	templatesHandler.templatesURL = server.TemplatesURL
	var dockerHandler = NewDockerHandler(middleWareService)
	if server.ActiveEndpoint != nil {
		dockerHandler.setupProxy(server.ActiveEndpoint)
	}
	var websocketHandler = NewWebSocketHandler()
	websocketHandler.endpoint = server.ActiveEndpoint
	var endpointHandler = NewEndpointHandler(middleWareService)
	endpointHandler.EndpointService = server.EndpointService
	var fileHandler = http.FileServer(http.Dir(server.AssetsPath))

	handler := &Handler{
		AuthHandler:      authHandler,
		UserHandler:      userHandler,
		EndpointHandler:  endpointHandler,
		SettingsHandler:  settingsHandler,
		TemplatesHandler: templatesHandler,
		DockerHandler:    dockerHandler,
		WebSocketHandler: websocketHandler,
		FileHandler:      fileHandler,
	}
	return http.ListenAndServe(server.BindAddress, handler)
}
