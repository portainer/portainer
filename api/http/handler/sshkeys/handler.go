package sshkeys

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle deploykey operations.
type Handler struct {
	*mux.Router
	SshkeyService portainer.SshkeyService
	CryptoService          portainer.CryptoService	
	DigitalSshkeyService   portainer.DigitalSshkeyService
	signatureService portainer.DigitalSignatureService	
	
}

// NewHandler creates a handler to manage deploykey operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/sshkeys",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.sshkeyCreate))).Methods(http.MethodPost)
	h.Handle("/sshkeys",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.sshkeyList))).Methods(http.MethodGet)
	h.Handle("/sshkeys/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.sshkeyDelete))).Methods(http.MethodDelete)

	return h
}
