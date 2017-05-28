package handler

import (
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"

	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// OldSettingsHandler represents an HTTP API handler for managing OldSettings.
type OldSettingsHandler struct {
	*mux.Router
	Logger      *log.Logger
	OldSettings *portainer.OldSettings
}

// NewOldSettingsHandler returns a new instance of OldSettingsHandler.
func NewOldSettingsHandler(bouncer *security.RequestBouncer, OldSettings *portainer.OldSettings) *OldSettingsHandler {
	h := &OldSettingsHandler{
		Router:      mux.NewRouter(),
		Logger:      log.New(os.Stderr, "", log.LstdFlags),
		OldSettings: OldSettings,
	}
	h.Handle("/OldSettings",
		bouncer.PublicAccess(http.HandlerFunc(h.handleGetOldSettings)))

	return h
}

// handleGetOldSettings handles GET requests on /OldSettings
func (handler *OldSettingsHandler) handleGetOldSettings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httperror.WriteMethodNotAllowedResponse(w, []string{http.MethodGet})
		return
	}

	encodeJSON(w, handler.OldSettings, handler.Logger)
}
