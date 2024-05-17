package users

import (
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

var (
	errUserAlreadyExists          = errors.New("User already exists")
	errAdminAlreadyInitialized    = errors.New("An administrator user already exists")
	errAdminCannotRemoveSelf      = errors.New("Cannot remove your own user account. Contact another administrator")
	errCannotRemoveLastLocalAdmin = errors.New("Cannot remove the last local administrator account")
	errCryptoHashFailure          = errors.New("Unable to hash data")
)

func hideFields(user *portainer.User) {
	user.Password = ""
}

// Handler is the HTTP handler used to handle user operations.
type Handler struct {
	*mux.Router
	bouncer                 security.BouncerService
	apiKeyService           apikey.APIKeyService
	DataStore               dataservices.DataStore
	CryptoService           portainer.CryptoService
	passwordStrengthChecker security.PasswordStrengthChecker
	AdminCreationDone       chan<- struct{}
	FileService             portainer.FileService
}

// NewHandler creates a handler to manage user operations.
func NewHandler(bouncer security.BouncerService, rateLimiter *security.RateLimiter, apiKeyService apikey.APIKeyService, passwordStrengthChecker security.PasswordStrengthChecker) *Handler {
	h := &Handler{
		Router:                  mux.NewRouter(),
		bouncer:                 bouncer,
		apiKeyService:           apiKeyService,
		passwordStrengthChecker: passwordStrengthChecker,
	}

	adminRouter := h.NewRoute().Subrouter()
	adminRouter.Use(bouncer.AdminAccess)

	teamLeaderRouter := h.NewRoute().Subrouter()
	teamLeaderRouter.Use(bouncer.TeamLeaderAccess)

	restrictedRouter := h.NewRoute().Subrouter()
	restrictedRouter.Use(bouncer.RestrictedAccess)

	authenticatedRouter := h.NewRoute().Subrouter()
	authenticatedRouter.Use(bouncer.AuthenticatedAccess)

	publicRouter := h.NewRoute().Subrouter()
	publicRouter.Use(bouncer.PublicAccess)

	adminRouter.Handle("/users", httperror.LoggerHandler(h.userCreate)).Methods(http.MethodPost)
	restrictedRouter.Handle("/users", httperror.LoggerHandler(h.userList)).Methods(http.MethodGet)

	authenticatedRouter.Handle("/users/me", httperror.LoggerHandler(h.userInspectMe)).Methods(http.MethodGet)
	restrictedRouter.Handle("/users/me", httperror.LoggerHandler(h.userInspectMe)).Methods(http.MethodGet)
	restrictedRouter.Handle("/users/{id}", httperror.LoggerHandler(h.userInspect)).Methods(http.MethodGet)
	authenticatedRouter.Handle("/users/{id}", httperror.LoggerHandler(h.userUpdate)).Methods(http.MethodPut)
	adminRouter.Handle("/users/{id}", httperror.LoggerHandler(h.userDelete)).Methods(http.MethodDelete)
	restrictedRouter.Handle("/users/{id}/tokens", httperror.LoggerHandler(h.userGetAccessTokens)).Methods(http.MethodGet)
	restrictedRouter.Handle("/users/{id}/tokens", rateLimiter.LimitAccess(httperror.LoggerHandler(h.userCreateAccessToken))).Methods(http.MethodPost)
	restrictedRouter.Handle("/users/{id}/tokens/{keyID}", httperror.LoggerHandler(h.userRemoveAccessToken)).Methods(http.MethodDelete)
	restrictedRouter.Handle("/users/{id}/memberships", httperror.LoggerHandler(h.userMemberships)).Methods(http.MethodGet)
	authenticatedRouter.Handle("/users/{id}/passwd", rateLimiter.LimitAccess(httperror.LoggerHandler(h.userUpdatePassword))).Methods(http.MethodPut)

	publicRouter.Handle("/users/admin/check", httperror.LoggerHandler(h.adminCheck)).Methods(http.MethodGet)
	publicRouter.Handle("/users/admin/init", httperror.LoggerHandler(h.adminInit)).Methods(http.MethodPost)

	// Helm repositories
	authenticatedRouter.Handle("/users/{id}/helm/repositories", httperror.LoggerHandler(h.userGetHelmRepos)).Methods(http.MethodGet)
	authenticatedRouter.Handle("/users/{id}/helm/repositories", httperror.LoggerHandler(h.userCreateHelmRepo)).Methods(http.MethodPost)
	authenticatedRouter.Handle("/users/{id}/helm/repositories/{repositoryID}", httperror.LoggerHandler(h.userDeleteHelmRepo)).Methods(http.MethodDelete)

	return h
}
