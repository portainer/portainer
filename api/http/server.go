package http

import (
	"github.com/portainer/portainer"

	"net/http"
)

// Server implements the portainer.Server interface
type Server struct {
	BindAddress    string
	AssetsPath     string
	UserService    portainer.UserService
	CryptoService  portainer.CryptoService
	JWTService     portainer.JWTService
	Settings       *portainer.Settings
	TemplatesURL   string
	EndpointConfig *portainer.EndpointConfiguration
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
	dockerHandler.setupProxy(server.EndpointConfig)
	var websocketHandler = NewWebSocketHandler()
	websocketHandler.endpointConfiguration = server.EndpointConfig
	var fileHandler = http.FileServer(http.Dir(server.AssetsPath))

	handler := &Handler{
		AuthHandler:      authHandler,
		UserHandler:      userHandler,
		SettingsHandler:  settingsHandler,
		TemplatesHandler: templatesHandler,
		DockerHandler:    dockerHandler,
		WebSocketHandler: websocketHandler,
		FileHandler:      fileHandler,
	}
	return http.ListenAndServe(server.BindAddress, handler)
}
