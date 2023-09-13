package ldap

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler used to handle LDAP search Operations
type Handler struct {
	*mux.Router
	DataStore   dataservices.DataStore
	FileService portainer.FileService
	LDAPService portainer.LDAPService
}

// NewHandler returns a new Handler
func NewHandler(bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/ldap/check",
		bouncer.AdminAccess(httperror.LoggerHandler(h.ldapCheck))).Methods(http.MethodPost)

	return h
}

func (handler *Handler) prefillSettings(ldapSettings *portainer.LDAPSettings) error {
	if !ldapSettings.AnonymousMode && ldapSettings.Password == "" {
		settings, err := handler.DataStore.Settings().Settings()
		if err != nil {
			return err
		}

		ldapSettings.Password = settings.LDAPSettings.Password
	}

	if (ldapSettings.TLSConfig.TLS || ldapSettings.StartTLS) && !ldapSettings.TLSConfig.TLSSkipVerify {
		caCertPath, err := handler.FileService.GetPathForTLSFile(filesystem.LDAPStorePath, portainer.TLSFileCA)
		if err != nil {
			return err
		}

		ldapSettings.TLSConfig.TLSCACertPath = caCertPath
	}

	return nil
}
