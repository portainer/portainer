package deploymentkeys

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle deploymentkey operations.
type Handler struct {
	*mux.Router
	DeploymentKeyService portainer.DeploymentKeyService
	SignatureService     portainer.DigitalSignatureService
}

func hideFields(deploymentkey *portainer.DeploymentKey) {
	deploymentkey.PrivateKey = nil
}

// NewHandler creates a handler to manage settings operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/deployment_keys",
		bouncer.AuthorizedAccess(httperror.LoggerHandler(h.deploymentkeyCreate))).Methods(http.MethodPost)
	h.Handle("/deployment_keys",
		bouncer.AuthorizedAccess(httperror.LoggerHandler(h.deploymentkeyList))).Methods(http.MethodGet)
	h.Handle("/deployment_keys/{id}",
		bouncer.AuthorizedAccess(httperror.LoggerHandler(h.deploymentkeyInspect))).Methods(http.MethodGet)
	h.Handle("/deployment_keys/{id}",
		bouncer.AuthorizedAccess(httperror.LoggerHandler(h.deploymentkeyDelete))).Methods(http.MethodDelete)
	return h
}
