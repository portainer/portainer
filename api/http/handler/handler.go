package handler

import (
	"net/http"
	"strings"

	"github.com/portainer/portainer/http/handler/auth"
	"github.com/portainer/portainer/http/handler/dockerhub"
	"github.com/portainer/portainer/http/handler/endpointgroups"
	"github.com/portainer/portainer/http/handler/endpointproxy"
	"github.com/portainer/portainer/http/handler/endpoints"
	"github.com/portainer/portainer/http/handler/file"
	"github.com/portainer/portainer/http/handler/motd"
	"github.com/portainer/portainer/http/handler/registries"
	"github.com/portainer/portainer/http/handler/resourcecontrols"
	"github.com/portainer/portainer/http/handler/settings"
	"github.com/portainer/portainer/http/handler/deploykeys"
	"github.com/portainer/portainer/http/handler/stacks"
	"github.com/portainer/portainer/http/handler/status"
	"github.com/portainer/portainer/http/handler/tags"
	"github.com/portainer/portainer/http/handler/teammemberships"
	"github.com/portainer/portainer/http/handler/teams"
	"github.com/portainer/portainer/http/handler/templates"
	"github.com/portainer/portainer/http/handler/upload"
	"github.com/portainer/portainer/http/handler/users"
	"github.com/portainer/portainer/http/handler/webhooks"
	"github.com/portainer/portainer/http/handler/websocket"
)

// Handler is a collection of all the service handlers.
type Handler struct {
	AuthHandler *auth.Handler

	DockerHubHandler       *dockerhub.Handler
	EndpointGroupHandler   *endpointgroups.Handler
	EndpointHandler        *endpoints.Handler
	EndpointProxyHandler   *endpointproxy.Handler
	FileHandler            *file.Handler
	MOTDHandler            *motd.Handler
	RegistryHandler        *registries.Handler
	ResourceControlHandler *resourcecontrols.Handler
	SettingsHandler        *settings.Handler
	StackHandler           *stacks.Handler
	StatusHandler          *status.Handler
	TagHandler             *tags.Handler
	DeploykeyHandler          *deploykeys.Handler
	TeamMembershipHandler  *teammemberships.Handler
	TeamHandler            *teams.Handler
	TemplatesHandler       *templates.Handler
	UploadHandler          *upload.Handler
	UserHandler            *users.Handler
	WebSocketHandler       *websocket.Handler
	WebhookHandler         *webhooks.Handler
}

// ServeHTTP delegates a request to the appropriate subhandler.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch {
	case strings.HasPrefix(r.URL.Path, "/api/auth"):
		http.StripPrefix("/api", h.AuthHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/dockerhub"):
		http.StripPrefix("/api", h.DockerHubHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/endpoint_groups"):
		http.StripPrefix("/api", h.EndpointGroupHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/endpoints"):
		switch {
		case strings.Contains(r.URL.Path, "/docker/"):
			http.StripPrefix("/api/endpoints", h.EndpointProxyHandler).ServeHTTP(w, r)
		case strings.Contains(r.URL.Path, "/extensions/storidge"):
			http.StripPrefix("/api/endpoints", h.EndpointProxyHandler).ServeHTTP(w, r)
		case strings.Contains(r.URL.Path, "/azure/"):
			http.StripPrefix("/api/endpoints", h.EndpointProxyHandler).ServeHTTP(w, r)
		default:
			http.StripPrefix("/api", h.EndpointHandler).ServeHTTP(w, r)
		}
	case strings.HasPrefix(r.URL.Path, "/api/motd"):
		http.StripPrefix("/api", h.MOTDHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/registries"):
		http.StripPrefix("/api", h.RegistryHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/resource_controls"):
		http.StripPrefix("/api", h.ResourceControlHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/settings"):
		http.StripPrefix("/api", h.SettingsHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/stacks"):
		http.StripPrefix("/api", h.StackHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/status"):
		http.StripPrefix("/api", h.StatusHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/tags"):
		http.StripPrefix("/api", h.TagHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/deploykeys"):
		http.StripPrefix("/api", h.DeploykeyHandler).ServeHTTP(w, r)
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
	case strings.HasPrefix(r.URL.Path, "/api/webhooks"):
		http.StripPrefix("/api", h.WebhookHandler).ServeHTTP(w, r)
	case strings.HasPrefix(r.URL.Path, "/"):
		h.FileHandler.ServeHTTP(w, r)
	}
}
