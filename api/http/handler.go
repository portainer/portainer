package http

import (
	"github.com/portainer/portainer"

	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// Handler is a collection of all the service handlers.
type Handler struct {
	AuthHandler      *AuthHandler
	UserHandler      *UserHandler
	EndpointHandler  *EndpointHandler
	SettingsHandler  *SettingsHandler
	TemplatesHandler *TemplatesHandler
	DockerHandler    *DockerHandler
	WebSocketHandler *WebSocketHandler
	UploadHandler    *UploadHandler
	FileHandler      *FileHandler
}

const (
	// ErrInvalidJSON defines an error raised the app is unable to parse request data
	ErrInvalidJSON = portainer.Error("Invalid JSON")
	// ErrInvalidRequestFormat defines an error raised when the format of the data sent in a request is not valid
	ErrInvalidRequestFormat = portainer.Error("Invalid request data format")
)

// ServeHTTP delegates a request to the appropriate subhandler.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, "/api/auth") {
		http.StripPrefix("/api", h.AuthHandler).ServeHTTP(w, r)
	} else if strings.HasPrefix(r.URL.Path, "/api/users") {
		http.StripPrefix("/api", h.UserHandler).ServeHTTP(w, r)
	} else if strings.HasPrefix(r.URL.Path, "/api/endpoints") {
		http.StripPrefix("/api", h.EndpointHandler).ServeHTTP(w, r)
	} else if strings.HasPrefix(r.URL.Path, "/api/settings") {
		http.StripPrefix("/api", h.SettingsHandler).ServeHTTP(w, r)
	} else if strings.HasPrefix(r.URL.Path, "/api/templates") {
		http.StripPrefix("/api", h.TemplatesHandler).ServeHTTP(w, r)
	} else if strings.HasPrefix(r.URL.Path, "/api/upload") {
		http.StripPrefix("/api", h.UploadHandler).ServeHTTP(w, r)
	} else if strings.HasPrefix(r.URL.Path, "/api/websocket") {
		http.StripPrefix("/api", h.WebSocketHandler).ServeHTTP(w, r)
	} else if strings.HasPrefix(r.URL.Path, "/api/docker") {
		http.StripPrefix("/api/docker", h.DockerHandler).ServeHTTP(w, r)
	} else if strings.HasPrefix(r.URL.Path, "/") {
		h.FileHandler.ServeHTTP(w, r)
	}
}

// Error writes an API error message to the response and logger.
func Error(w http.ResponseWriter, err error, code int, logger *log.Logger) {
	// Log error.
	if logger != nil {
		logger.Printf("http error: %s (code=%d)", err, code)
	}

	// Write generic error response.
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(&errorResponse{Err: err.Error()})
}

// errorResponse is a generic response for sending a error.
type errorResponse struct {
	Err string `json:"err,omitempty"`
}

// handleNotAllowed writes an API error message to the response and sets the Allow header.
func handleNotAllowed(w http.ResponseWriter, allowedMethods []string) {
	w.Header().Set("Allow", strings.Join(allowedMethods, ", "))
	w.WriteHeader(http.StatusMethodNotAllowed)
	json.NewEncoder(w).Encode(&errorResponse{Err: http.StatusText(http.StatusMethodNotAllowed)})
}

// encodeJSON encodes v to w in JSON format. Error() is called if encoding fails.
func encodeJSON(w http.ResponseWriter, v interface{}, logger *log.Logger) {
	if err := json.NewEncoder(w).Encode(v); err != nil {
		Error(w, err, http.StatusInternalServerError, logger)
	}
}
