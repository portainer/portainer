package websocket

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
)

// Handler is the HTTP handler used to handle websocket operations.
type Handler struct {
	*mux.Router
	EndpointService    portainer.EndpointService
	SignatureService   portainer.DigitalSignatureService
	connectionUpgrader websocket.Upgrader
}

// NewHandler creates a handler to manage websocket operations.
func NewHandler() *Handler {
	h := &Handler{
		Router:             mux.NewRouter(),
		connectionUpgrader: websocket.Upgrader{},
	}
	h.Handle("/websocket/exec", httperror.LoggerHandler(h.websocketExec)).Methods(http.MethodGet)
	return h
}
