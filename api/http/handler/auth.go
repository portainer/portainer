package handler

import (
	"github.com/portainer/portainer"

	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/asaskevich/govalidator"
	"github.com/gorilla/mux"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"
)

// AuthHandler represents an HTTP API handler for managing authentication.
type AuthHandler struct {
	*mux.Router
	Logger                *log.Logger
	authDisabled          bool
	UserService           portainer.UserService
	CryptoService         portainer.CryptoService
	JWTService            portainer.JWTService
	LDAPService           portainer.LDAPService
	SettingsService       portainer.SettingsService
	TeamService           portainer.TeamService
	TeamMembershipService portainer.TeamMembershipService
}

const (
	// ErrInvalidCredentialsFormat is an error raised when credentials format is not valid
	ErrInvalidCredentialsFormat = portainer.Error("Invalid credentials format")
	// ErrInvalidCredentials is an error raised when credentials for a user are invalid
	ErrInvalidCredentials = portainer.Error("Invalid credentials")
	// ErrAuthDisabled is an error raised when trying to access the authentication endpoints
	// when the server has been started with the --no-auth flag
	ErrAuthDisabled = portainer.Error("Authentication is disabled")
)

// NewAuthHandler returns a new instance of AuthHandler.
func NewAuthHandler(bouncer *security.RequestBouncer, rateLimiter *security.RateLimiter, authDisabled bool) *AuthHandler {
	h := &AuthHandler{
		Router:       mux.NewRouter(),
		Logger:       log.New(os.Stderr, "", log.LstdFlags),
		authDisabled: authDisabled,
	}
	h.Handle("/auth",
		rateLimiter.LimitAccess(bouncer.PublicAccess(http.HandlerFunc(h.handlePostAuth)))).Methods(http.MethodPost)

	return h
}

type (
	postAuthRequest struct {
		Username string `valid:"required"`
		Password string `valid:"required"`
	}

	postAuthResponse struct {
		JWT string `json:"jwt"`
	}
)

func (handler *AuthHandler) handlePostAuth(w http.ResponseWriter, r *http.Request) {
	if handler.authDisabled {
		httperror.WriteErrorResponse(w, ErrAuthDisabled, http.StatusServiceUnavailable, handler.Logger)
		return
	}

	var req postAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidCredentialsFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	var username = req.Username
	var password = req.Password

	settings, err := handler.SettingsService.Settings()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	u, err := handler.UserService.UserByUsername(username)
	if err != nil && err != portainer.ErrUserNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if (u != nil && u.ID == 1) || settings.AuthenticationMethod == portainer.AuthenticationInternal {
		if u == nil {
			httperror.WriteErrorResponse(w, ErrInvalidCredentials, http.StatusBadRequest, handler.Logger)
			return
		}

		err = handler.CryptoService.CompareHashAndData(u.Password, password)
		if err != nil {
			httperror.WriteErrorResponse(w, ErrInvalidCredentials, http.StatusUnprocessableEntity, handler.Logger)
			return
		}

	} else if settings.AuthenticationMethod == portainer.AuthenticationLDAP {

		err = handler.LDAPService.AuthenticateUser(username, password, &settings.LDAPSettings)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}

		if u == nil {
			u = &portainer.User{
				Username: username,
				Role:     portainer.StandardUserRole,
			}
			err = handler.UserService.CreateUser(u)
			if err != nil {
				httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
				return
			}
		}

		err = handler.addLdapUserIntoTeams(u, settings)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
	} else {
		// Unknown auth method
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if u == nil {
		// User not found in any auth provider
		httperror.WriteErrorResponse(w, ErrInvalidCredentials, http.StatusBadRequest, handler.Logger)
		return
	}

	tokenData := &portainer.TokenData{
		ID:       u.ID,
		Username: u.Username,
		Role:     u.Role,
	}

	token, err := handler.JWTService.GenerateToken(tokenData)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postAuthResponse{JWT: token}, handler.Logger)
}

func (handler *AuthHandler) addLdapUserIntoTeams(user *portainer.User, settings *portainer.Settings) error {
	teams, err := handler.TeamService.Teams()
	if err != nil {
		return err
	}

	userLdapGroups, err := handler.LDAPService.GetUserGroups(user.Username, &settings.LDAPSettings)
	if err != nil {
		return err
	}

	userMemberships, err := handler.TeamMembershipService.TeamMembershipsByUserID(user.ID)
	if err != nil {
		return err
	}

	for _, team := range teams {
		if teamExists(team.Name, userLdapGroups) {
			// Corrensponding team exists in boltDB

			if teamMembershipExists(team.ID, userMemberships) {
				// User is already in that team
				continue
			}

			membership := &portainer.TeamMembership{
				UserID: user.ID,
				TeamID: team.ID,
				Role:   portainer.TeamMember,
			}

			err = handler.TeamMembershipService.CreateTeamMembership(membership)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func teamExists(teamName string, ldapGroups []string) bool {
	for _, group := range ldapGroups {
		if group == teamName {
			return true
		}
	}
	return false
}

func teamMembershipExists(teamID portainer.TeamID, memberships []portainer.TeamMembership) bool {
	for _, membership := range memberships {
		if membership.TeamID == teamID {
			return true
		}
	}
	return false
}
