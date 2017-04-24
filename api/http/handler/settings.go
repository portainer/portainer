package handler

import (
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/middleware"

	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// SettingsHandler represents an HTTP API handler for managing settings.
type SettingsHandler struct {
	*mux.Router
	Logger   *log.Logger
	settings *portainer.Settings
}

// NewSettingsHandler returns a new instance of SettingsHandler.
func NewSettingsHandler(mw *middleware.Service, settings *portainer.Settings) *SettingsHandler {
	h := &SettingsHandler{
		Router:   mux.NewRouter(),
		Logger:   log.New(os.Stderr, "", log.LstdFlags),
		settings: settings,
	}
	h.Handle("/settings",
		mw.Public(http.HandlerFunc(h.handleGetSettings)))

	return h
}

// handleGetSettings handles GET requests on /settings
func (handler *SettingsHandler) handleGetSettings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httperror.WriteMethodNotAllowedResponse(w, []string{http.MethodGet})
		return
	}

	encodeJSON(w, handler.settings, handler.Logger)
}
