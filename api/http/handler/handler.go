package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/handler/extensions"
)

// Handler is a collection of all the service handlers.
type Handler struct {
	AuthHandler           *AuthHandler
	UserHandler           *UserHandler
	TeamHandler           *TeamHandler
	TeamMembershipHandler *TeamMembershipHandler
	EndpointHandler       *EndpointHandler
	RegistryHandler       *RegistryHandler
	DockerHubHandler      *DockerHubHandler
	ExtensionHandler      *ExtensionHandler
	StoridgeHandler       *extensions.StoridgeHandler
	ResourceHandler       *ResourceHandler
	StackHandler          *StackHandler
	StatusHandler         *StatusHandler
	SettingsHandler       *SettingsHandler
	TemplatesHandler      *TemplatesHandler
	DockerHandler         *DockerHandler
	WebSocketHandler      *WebSocketHandler
	UploadHandler         *UploadHandler
	FileHandler           *FileHandler
}

const (
	// ErrInvalidJSON defines an error raised the app is unable to parse request data
	ErrInvalidJSON = portainer.Error("Invalid JSON")
	// ErrInvalidRequestFormat defines an error raised when the format of the data sent in a request is not valid
	ErrInvalidRequestFormat = portainer.Error("Invalid request data format")
	// ErrInvalidQueryFormat defines an error raised when the data sent in the query or the URL is invalid
	ErrInvalidQueryFormat = portainer.Error("Invalid query format")
)

// ServeHTTP delegates a request to the appropriate subhandler.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	switch {
	case strings.HasPrefix(r.URL.Path, "/api/auth"):
		http.StripPrefix("/api", h.AuthHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/dockerhub"):
		http.StripPrefix("/api", h.DockerHubHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/endpoints"):
		switch {
		case strings.Contains(r.URL.Path, "/docker"):
			http.StripPrefix("/api/endpoints", h.DockerHandler).ServeHTTP(w, r)
		case strings.Contains(r.URL.Path, "/stacks"):
			http.StripPrefix("/api/endpoints", h.StackHandler).ServeHTTP(w, r)
		case strings.Contains(r.URL.Path, "/extensions/storidge"):
			http.StripPrefix("/api/endpoints", h.StoridgeHandler).ServeHTTP(w, r)
		case strings.Contains(r.URL.Path, "/extensions"):
			http.StripPrefix("/api/endpoints", h.ExtensionHandler).ServeHTTP(w, r)
		default:
			http.StripPrefix("/api", h.EndpointHandler).ServeHTTP(w, r)
		}
	case strings.HasPrefix(r.URL.Path, "/api/registries"):
		http.StripPrefix("/api", h.RegistryHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/resource_controls"):
		http.StripPrefix("/api", h.ResourceHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/settings"):
		http.StripPrefix("/api", h.SettingsHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/status"):
		http.StripPrefix("/api", h.StatusHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/templates"):
		http.StripPrefix("/api", h.TemplatesHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/upload"):
		http.StripPrefix("/api", h.UploadHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/users"):
		http.StripPrefix("/api", h.UserHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/teams"):
		http.StripPrefix("/api", h.TeamHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/team_memberships"):
		http.StripPrefix("/api", h.TeamMembershipHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/websocket"):
		http.StripPrefix("/api", h.WebSocketHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/"):
		h.FileHandler.ServeHTTP(w, r)
	}
}

// encodeJSON encodes v to w in JSON format. WriteErrorResponse() is called if encoding fails.
func encodeJSON(w http.ResponseWriter, v interface{}, logger *log.Logger) {
	if err := json.NewEncoder(w).Encode(v); err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, logger)
	}
}
