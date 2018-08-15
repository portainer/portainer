package webhooks

import (
	"net/http"

	"github.com/gorilla/mux"
	portainer "github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle webhook operations.
type Handler struct {
	*mux.Router
	WebhookService  portainer.WebhookService
	EndpointService portainer.EndpointService
	requestBouncer  *security.RequestBouncer
}

// NewHandler creates a handler to manage settings operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router:         mux.NewRouter(),
		requestBouncer: bouncer,
	}
	h.Handle("/webhooks",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.webhookCreate))).Methods(http.MethodPost)
	h.Handle("/webhook/{id}",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.webhookInspect))).Methods(http.MethodGet)
	h.Handle("/webhooks",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.webhookList))).Methods(http.MethodGet)
	h.Handle("/webhook/{serviceID}",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.webhookDelete))).Methods(http.MethodDelete)
	h.Handle("/webhook/{token}",
		bouncer.PublicAccess(httperror.LoggerHandler(h.webhookExecute))).Methods(http.MethodPost)
	return h
}
