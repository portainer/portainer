package auth

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"
)

const (
	// ErrInvalidCredentials is an error raised when credentials for a user are invalid
	ErrInvalidCredentials = portainer.Error("Invalid credentials")
	// ErrAuthDisabled is an error raised when trying to access the authentication endpoints
	// when the server has been started with the --no-auth flag
	ErrAuthDisabled = portainer.Error("Authentication is disabled")
)

// Handler is the HTTP handler used to handle authentication operations.
type Handler struct {
	*mux.Router
	authDisabled          bool
	UserService           	portainer.UserService
	CryptoService         	portainer.CryptoService
	JWTService            	portainer.JWTService
	LDAPService           	portainer.LDAPService
	SettingsService       	portainer.SettingsService
	TeamService           	portainer.TeamService
	TeamMembershipService   portainer.TeamMembershipService
	//DigitalSignatureService portainer.DigitalSignatureService
}

// NewHandler creates a handler to manage authentication operations.
func NewHandler(bouncer *security.RequestBouncer, rateLimiter *security.RateLimiter, authDisabled bool) *Handler {
	h := &Handler{
		Router:       mux.NewRouter(),
		authDisabled: authDisabled,
	}
	h.Handle("/auth",
		rateLimiter.LimitAccess(bouncer.PublicAccess(httperror.LoggerHandler(h.authenticate)))).Methods(http.MethodPost)

	return h
}
