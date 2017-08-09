package handler

import (
	"encoding/json"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/file"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"

	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// SettingsHandler represents an HTTP API handler for managing Settings.
type SettingsHandler struct {
	*mux.Router
	Logger          *log.Logger
	SettingsService portainer.SettingsService
	LDAPService     portainer.LDAPService
	FileService     portainer.FileService
}

// NewSettingsHandler returns a new instance of OldSettingsHandler.
func NewSettingsHandler(bouncer *security.RequestBouncer) *SettingsHandler {
	h := &SettingsHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/settings",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handleGetSettings))).Methods(http.MethodGet)
	h.Handle("/settings",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePutSettings))).Methods(http.MethodPut)
	h.Handle("/settings/public",
		bouncer.PublicAccess(http.HandlerFunc(h.handleGetPublicSettings))).Methods(http.MethodGet)
	h.Handle("/settings/authentication/checkLDAP",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePutSettingsLDAPCheck))).Methods(http.MethodPut)

	return h
}

// handleGetSettings handles GET requests on /settings
func (handler *SettingsHandler) handleGetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := handler.SettingsService.Settings()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, settings, handler.Logger)
	return
}

// handleGetPublicSettings handles GET requests on /settings/public
func (handler *SettingsHandler) handleGetPublicSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := handler.SettingsService.Settings()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	publicSettings := &publicSettingsResponse{
		LogoURL:                     settings.LogoURL,
		DisplayExternalContributors: settings.DisplayExternalContributors,
		AuthenticationMethod:        settings.AuthenticationMethod,
	}

	encodeJSON(w, publicSettings, handler.Logger)
	return
}

type publicSettingsResponse struct {
	LogoURL                     string                         `json:"LogoURL"`
	DisplayExternalContributors bool                           `json:"DisplayExternalContributors"`
	AuthenticationMethod        portainer.AuthenticationMethod `json:"AuthenticationMethod"`
}

// handlePutSettings handles PUT requests on /settings
func (handler *SettingsHandler) handlePutSettings(w http.ResponseWriter, r *http.Request) {
	var req putSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	settings := &portainer.Settings{
		TemplatesURL:                req.TemplatesURL,
		LogoURL:                     req.LogoURL,
		BlackListedLabels:           req.BlackListedLabels,
		DisplayExternalContributors: req.DisplayExternalContributors,
		LDAPSettings:                req.LDAPSettings,
	}

	if req.AuthenticationMethod == 1 {
		settings.AuthenticationMethod = portainer.AuthenticationInternal
	} else if req.AuthenticationMethod == 2 {
		settings.AuthenticationMethod = portainer.AuthenticationLDAP
	} else {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	if (settings.LDAPSettings.TLSConfig.TLS || settings.LDAPSettings.StartTLS) && !settings.LDAPSettings.TLSConfig.TLSSkipVerify {
		caCertPath, _ := handler.FileService.GetPathForTLSFile(file.LDAPStorePath, portainer.TLSFileCA)
		settings.LDAPSettings.TLSConfig.TLSCACertPath = caCertPath
		settings.LDAPSettings.TLSConfig.TLSCertPath = ""
		settings.LDAPSettings.TLSConfig.TLSKeyPath = ""
		// certPath, _ := handler.FileService.GetPathForTLSFile(file.LDAPStorePath, portainer.TLSFileCert)
		// settings.LDAPSettings.TLSConfig.TLSCertPath = certPath
		// keyPath, _ := handler.FileService.GetPathForTLSFile(file.LDAPStorePath, portainer.TLSFileKey)
		// settings.LDAPSettings.TLSConfig.TLSKeyPath = keyPath
	} else {
		settings.LDAPSettings.TLSConfig.TLSCACertPath = ""
		settings.LDAPSettings.TLSConfig.TLSCertPath = ""
		settings.LDAPSettings.TLSConfig.TLSKeyPath = ""
		err := handler.FileService.DeleteTLSFiles(file.LDAPStorePath)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		}
	}

	err = handler.SettingsService.StoreSettings(settings)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
	}
}

type putSettingsRequest struct {
	TemplatesURL                string                 `valid:"required"`
	LogoURL                     string                 `valid:""`
	BlackListedLabels           []portainer.Pair       `valid:""`
	DisplayExternalContributors bool                   `valid:""`
	AuthenticationMethod        int                    `valid:"required"`
	LDAPSettings                portainer.LDAPSettings `valid:""`
}

// handlePutSettingsLDAPCheck handles PUT requests on /settings/ldap/check
func (handler *SettingsHandler) handlePutSettingsLDAPCheck(w http.ResponseWriter, r *http.Request) {
	var req putSettingsLDAPCheckRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	if req.LDAPSettings.TLSConfig.TLS && !req.LDAPSettings.TLSConfig.TLSSkipVerify {

		caCertPath, _ := handler.FileService.GetPathForTLSFile(file.LDAPStorePath, portainer.TLSFileCA)
		req.LDAPSettings.TLSConfig.TLSCACertPath = caCertPath
		// certPath, _ := handler.FileService.GetPathForTLSFile(file.LDAPStorePath, portainer.TLSFileCert)
		// req.LDAPSettings.TLSConfig.TLSCertPath = certPath
		// keyPath, _ := handler.FileService.GetPathForTLSFile(file.LDAPStorePath, portainer.TLSFileKey)
		// req.LDAPSettings.TLSConfig.TLSKeyPath = keyPath
	}

	err = handler.LDAPService.TestConnectivity(&req.LDAPSettings)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type putSettingsLDAPCheckRequest struct {
	LDAPSettings portainer.LDAPSettings `valid:""`
}
