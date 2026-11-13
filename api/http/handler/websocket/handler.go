package websocket

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/http/proxy/factory/docker"
	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes/cli"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// Handler is the HTTP handler used to handle websocket operations.
type Handler struct {
	*mux.Router
	DataStore                   dataservices.DataStore
	SignatureService            portainer.DigitalSignatureService
	ReverseTunnelService        portainer.ReverseTunnelService
	KubernetesClientFactory     *cli.ClientFactory
	DockerClientFactory         *dockerclient.ClientFactory
	requestBouncer              security.BouncerService
	connectionUpgrader          websocket.Upgrader
	kubernetesTokenCacheManager *kubernetes.TokenCacheManager
}

// NewHandler creates a handler to manage websocket operations.
func NewHandler(kubernetesTokenCacheManager *kubernetes.TokenCacheManager, bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router:                      mux.NewRouter(),
		connectionUpgrader:          websocket.Upgrader{},
		requestBouncer:              bouncer,
		kubernetesTokenCacheManager: kubernetesTokenCacheManager,
	}
	h.PathPrefix("/websocket/exec").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.websocketExec)))
	h.PathPrefix("/websocket/attach").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.websocketAttach)))
	h.PathPrefix("/websocket/pod").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.websocketPodExec)))
	h.PathPrefix("/websocket/kubernetes-shell").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.websocketShellPodExec)))
	return h
}

func (handler *Handler) dockerTransport(endpoint *portainer.Endpoint) (*docker.Transport, error) {
	return docker.NewTransport(&docker.TransportParameters{
		Endpoint:            endpoint,
		DataStore:           handler.DataStore,
		DockerClientFactory: handler.DockerClientFactory,
	}, nil, nil, nil)
}
