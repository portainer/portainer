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
	FileService     portainer.FileService
	Settings        *portainer.Settings
	TemplatesURL    string
	ActiveEndpoint  *portainer.Endpoint
	Handler         *Handler
}

func (server *Server) updateActiveEndpoint(endpoint *portainer.Endpoint) error {
	if endpoint != nil {
		server.ActiveEndpoint = endpoint
		server.Handler.WebSocketHandler.endpoint = endpoint
		err := server.Handler.DockerHandler.setupProxy(endpoint)
		if err != nil {
			return err
		}
		err = server.EndpointService.SetActive(endpoint)
		if err != nil {
			return err
		}
	}
	return nil
}

// Start starts the HTTP server
func (server *Server) Start() error {
	middleWareService := &middleWareService{
		jwtService: server.JWTService,
	}

	var stateHandler = NewStateHandler()
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
	var websocketHandler = NewWebSocketHandler()
	// EndpointHandler requires a reference to the server to be able to update the active endpoint.
	var endpointHandler = NewEndpointHandler(middleWareService)
	endpointHandler.EndpointService = server.EndpointService
	endpointHandler.FileService = server.FileService
	endpointHandler.server = server
	var uploadHandler = NewUploadHandler(middleWareService)
	uploadHandler.FileService = server.FileService
	var fileHandler = newFileHandler(server.AssetsPath)

	server.Handler = &Handler{
		StateHandler:     stateHandler,
		AuthHandler:      authHandler,
		UserHandler:      userHandler,
		EndpointHandler:  endpointHandler,
		SettingsHandler:  settingsHandler,
		TemplatesHandler: templatesHandler,
		DockerHandler:    dockerHandler,
		WebSocketHandler: websocketHandler,
		FileHandler:      fileHandler,
		UploadHandler:    uploadHandler,
	}
	err := server.updateActiveEndpoint(server.ActiveEndpoint)
	if err != nil {
		return err
	}

	return http.ListenAndServe(server.BindAddress, server.Handler)
}
