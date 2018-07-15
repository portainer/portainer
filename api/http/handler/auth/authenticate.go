package auth

import (
	"log"
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type authenticatePayload struct {
	Username string
	Password string
}

type authenticateResponse struct {
	JWT string `json:"jwt"`
}

func (payload *authenticatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Username) {
		return portainer.Error("Invalid username")
	}
	if govalidator.IsNull(payload.Password) {
		return portainer.Error("Invalid password")
	}
	return nil
}

func (handler *Handler) authenticate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	if handler.authDisabled {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Cannot authenticate user. Portainer was started with the --no-auth flag", ErrAuthDisabled}
	}

	var payload authenticatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	u, err := handler.UserService.UserByUsername(payload.Username)
	if err != nil && err != portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve a user with the specified username from the database", err}
	}

	if settings.AuthenticationMethod == portainer.AuthenticationLDAP {
		u, err = handler.authLdap(u, payload.Username, payload.Password, settings)
		if err != nil && err != portainer.ErrUnauthorized {
			err = handler.authInternal(u, payload.Password)
			if err != nil {
				return &httperror.HandlerError{http.StatusUnprocessableEntity, "Invalid credentials", err}
			}
		} else if err != nil || u == nil {
			return &httperror.HandlerError{http.StatusUnprocessableEntity, "Invalid credentials", err}
		}
	} else {
		err = handler.authInternal(u, payload.Password)
		if err != nil {
			return &httperror.HandlerError{http.StatusUnprocessableEntity, "Invalid credentials", portainer.ErrUnauthorized}
		}
	}

	tokenData := &portainer.TokenData{
		ID:       u.ID,
		Username: u.Username,
		Role:     u.Role,
	}

	token, err := handler.JWTService.GenerateToken(tokenData)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to generate JWT token", err}
	}

	return response.JSON(w, &authenticateResponse{JWT: token})
}

func (handler *Handler) authInternal(user *portainer.User, password string) error {
	if user == nil {
		return portainer.Error("User not found")
	}

	err := handler.CryptoService.CompareHashAndData(user.Password, password)
	if err != nil {
		return portainer.Error("Incorrect password")
	}
	return nil
}

func (handler *Handler) authLdap(user *portainer.User, username string, password string, settings *portainer.Settings) (*portainer.User, error) {
	err := handler.LDAPService.AuthenticateUser(username, password, &settings.LDAPSettings)
	if err != nil {
		return user, err
	}

	if user == nil {
		user = &portainer.User{
			Username: username,
			Role:     portainer.StandardUserRole,
		}
		err = handler.UserService.CreateUser(user)
		if err == nil {
			user, err = handler.UserService.UserByUsername(username)
		}
	}

	err = handler.addUserIntoTeams(user, settings)
	if err != nil {
		log.Printf("Warning user adding to teams returned error: %s", err.Error())
	}

	return user, nil
}

func (handler *Handler) addUserIntoTeams(user *portainer.User, settings *portainer.Settings) error {
	teams, err := handler.TeamService.Teams()
	if err != nil {
		return err
	}

	userGroups, err := handler.LDAPService.GetUserGroups(user.Username, &settings.LDAPSettings)
	if err != nil {
		return err
	}

	userMemberships, err := handler.TeamMembershipService.TeamMembershipsByUserID(user.ID)
	if err != nil {
		return err
	}

	for _, team := range teams {
		if teamExists(team.Name, userGroups) {

			if teamMembershipExists(team.ID, userMemberships) {
				continue
			}

			membership := &portainer.TeamMembership{
				UserID: user.ID,
				TeamID: team.ID,
				Role:   portainer.TeamMember,
			}

			handler.TeamMembershipService.CreateTeamMembership(membership)
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
