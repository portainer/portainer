package auth

import (
	"log"
	"net/http"
	"strings"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
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

	if err == portainer.ErrObjectNotFound && settings.AuthenticationMethod == portainer.AuthenticationInternal {
		return &httperror.HandlerError{http.StatusUnprocessableEntity, "Invalid credentials", portainer.ErrUnauthorized}
	}

	if settings.AuthenticationMethod == portainer.AuthenticationLDAP {
		if u == nil && settings.LDAPSettings.AutoCreateUsers {
			return handler.authenticateLDAPAndCreateUser(w, payload.Username, payload.Password, &settings.LDAPSettings)
		} else if u == nil && !settings.LDAPSettings.AutoCreateUsers {
			return &httperror.HandlerError{http.StatusUnprocessableEntity, "Invalid credentials", portainer.ErrUnauthorized}
		}
		return handler.authenticateLDAP(w, u, payload.Password, &settings.LDAPSettings)
	}

	return handler.authenticateInternal(w, u, payload.Password)
}

func (handler *Handler) authenticateLDAP(w http.ResponseWriter, user *portainer.User, password string, ldapSettings *portainer.LDAPSettings) *httperror.HandlerError {
	err := handler.LDAPService.AuthenticateUser(user.Username, password, ldapSettings)
	if err != nil {
		return handler.authenticateInternal(w, user, password)
	}

	err = handler.addUserIntoTeams(user, ldapSettings)
	if err != nil {
		log.Printf("Warning: unable to automatically add user into teams: %s\n", err.Error())
	}

	return handler.writeToken(w, user)
}

func (handler *Handler) authenticateInternal(w http.ResponseWriter, user *portainer.User, password string) *httperror.HandlerError {
	err := handler.CryptoService.CompareHashAndData(user.Password, password)
	if err != nil {
		return &httperror.HandlerError{http.StatusUnprocessableEntity, "Invalid credentials", portainer.ErrUnauthorized}
	}

	return handler.writeToken(w, user)
}

func (handler *Handler) authenticateLDAPAndCreateUser(w http.ResponseWriter, username, password string, ldapSettings *portainer.LDAPSettings) *httperror.HandlerError {
	err := handler.LDAPService.AuthenticateUser(username, password, ldapSettings)
	if err != nil {
		return &httperror.HandlerError{http.StatusUnprocessableEntity, "Invalid credentials", err}
	}

	user := &portainer.User{
		Username: username,
		Role:     portainer.StandardUserRole,
	}

	err = handler.UserService.CreateUser(user)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist user inside the database", err}
	}

	err = handler.addUserIntoTeams(user, ldapSettings)
	if err != nil {
		log.Printf("Warning: unable to automatically add user into teams: %s\n", err.Error())
	}

	return handler.writeToken(w, user)
}

func (handler *Handler) writeToken(w http.ResponseWriter, user *portainer.User) *httperror.HandlerError {
	tokenData := &portainer.TokenData{
		ID:       user.ID,
		Username: user.Username,
		Role:     user.Role,
	}

	_, err := handler.ExtensionService.Extension(portainer.RBACExtension)
	if err == portainer.ErrObjectNotFound {
		return handler.persistAndWriteToken(w, tokenData)
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a extension with the specified identifier inside the database", err}
	}

	authorizations, err := handler.getUserAuthorizations(user)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve authorizations associated to the user", err}
	}

	tokenData.Authorizations = authorizations
	return handler.persistAndWriteToken(w, tokenData)
}

// TODO: relocate this code?
// Use elispsis via ... ? a,b,c,d... unlimited authorizations parameters
func intersection(a, b portainer.Authorizations) portainer.Authorizations {
	c := make(map[portainer.Authorization]bool)

	for k := range b {
		if _, ok := a[k]; ok {
			c[k] = true
		}
	}
	return c
}

func (handler *Handler) getUserAuthorizations(user *portainer.User) (portainer.Authorizations, error) {

	var roleIdentifiers []portainer.RoleID
	if user.RoleID == 0 {
		userMemberships, err := handler.TeamMembershipService.TeamMembershipsByUserID(user.ID)
		if err != nil {
			return nil, err
		}

		for _, membership := range userMemberships {
			team, err := handler.TeamService.Team(membership.TeamID)
			if err != nil {
				return nil, err
			}

			roleIdentifiers = append(roleIdentifiers, team.RoleID)
		}
	} else {
		roleIdentifiers = append(roleIdentifiers, user.RoleID)
	}

	var roleAuthorizations []portainer.Authorizations
	for _, id := range roleIdentifiers {
		role, err := handler.RoleService.Role(portainer.RoleID(id))
		if err != nil {
			return nil, err
		}

		roleAuthorizations = append(roleAuthorizations, role.Authorizations)
	}

	processedAuthorizations := roleAuthorizations[0]
	for idx, authorizations := range roleAuthorizations {
		if idx == 0 {
			continue
		}
		processedAuthorizations = intersection(processedAuthorizations, authorizations)
	}

	return processedAuthorizations, nil
}

func (handler *Handler) persistAndWriteToken(w http.ResponseWriter, tokenData *portainer.TokenData) *httperror.HandlerError {
	token, err := handler.JWTService.GenerateToken(tokenData)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to generate JWT token", err}
	}

	return response.JSON(w, &authenticateResponse{JWT: token})
}

func (handler *Handler) addUserIntoTeams(user *portainer.User, settings *portainer.LDAPSettings) error {
	teams, err := handler.TeamService.Teams()
	if err != nil {
		return err
	}

	userGroups, err := handler.LDAPService.GetUserGroups(user.Username, settings)
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

			err := handler.TeamMembershipService.CreateTeamMembership(membership)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func teamExists(teamName string, ldapGroups []string) bool {
	for _, group := range ldapGroups {
		if strings.ToLower(group) == strings.ToLower(teamName) {
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
