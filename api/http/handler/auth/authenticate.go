package auth

import (
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/asaskevich/govalidator"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

type authenticatePayload struct {
	// Username
	Username string `example:"admin" validate:"required"`
	// Password
	Password string `example:"mypassword" validate:"required"`
}

type authenticateResponse struct {
	// JWT token used to authenticate against the API
	JWT string `json:"jwt" example:"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzAB"`
}

func (payload *authenticatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Username) {
		return errors.New("Invalid username")
	}

	if govalidator.IsNull(payload.Password) {
		return errors.New("Invalid password")
	}

	return nil
}

// @id AuthenticateUser
// @summary Authenticate
// @description **Access policy**: public
// @description Use this environment(endpoint) to authenticate against Portainer using a username and password.
// @tags auth
// @accept json
// @produce json
// @param body body authenticatePayload true "Credentials used for authentication"
// @success 200 {object} authenticateResponse "Success"
// @failure 400 "Invalid request"
// @failure 422 "Invalid Credentials"
// @failure 500 "Server error"
// @router /auth [post]
func (handler *Handler) authenticate(rw http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload authenticatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve settings from the database", err)
	}

	user, err := handler.DataStore.User().UserByUsername(payload.Username)
	if err != nil {
		if !handler.DataStore.IsErrObjectNotFound(err) {
			return httperror.InternalServerError("Unable to retrieve a user with the specified username from the database", err)
		}

		if settings.AuthenticationMethod == portainer.AuthenticationInternal ||
			settings.AuthenticationMethod == portainer.AuthenticationOAuth ||
			(settings.AuthenticationMethod == portainer.AuthenticationLDAP && !settings.LDAPSettings.AutoCreateUsers) {
			// avoid username enumeration timing attack by creating a fake user
			// https://en.wikipedia.org/wiki/Timing_attack
			user = &portainer.User{
				Username: "portainer-fake-username",
				Password: "$2a$10$abcdefghijklmnopqrstuvwx..ABCDEFGHIJKLMNOPQRSTUVWXYZ12", // fake but valid format bcrypt hash
			}
		}
	}

	if user != nil && isUserInitialAdmin(user) || settings.AuthenticationMethod == portainer.AuthenticationInternal {
		return handler.authenticateInternal(rw, user, payload.Password)
	}

	if settings.AuthenticationMethod == portainer.AuthenticationOAuth {
		return httperror.NewError(http.StatusUnprocessableEntity, "Only initial admin is allowed to login without oauth", httperrors.ErrUnauthorized)
	}

	if settings.AuthenticationMethod == portainer.AuthenticationLDAP {
		return handler.authenticateLDAP(rw, user, payload.Username, payload.Password, &settings.LDAPSettings)
	}

	return httperror.NewError(http.StatusUnprocessableEntity, "Login method is not supported", httperrors.ErrUnauthorized)
}

func isUserInitialAdmin(user *portainer.User) bool {
	return int(user.ID) == 1
}

func (handler *Handler) authenticateInternal(w http.ResponseWriter, user *portainer.User, password string) *httperror.HandlerError {
	err := handler.CryptoService.CompareHashAndData(user.Password, password)
	if err != nil {
		return httperror.NewError(http.StatusUnprocessableEntity, "Invalid credentials", httperrors.ErrUnauthorized)
	}

	forceChangePassword := !handler.passwordStrengthChecker.Check(password)

	return handler.writeToken(w, user, forceChangePassword)
}

func (handler *Handler) authenticateLDAP(w http.ResponseWriter, user *portainer.User, username, password string, ldapSettings *portainer.LDAPSettings) *httperror.HandlerError {
	err := handler.LDAPService.AuthenticateUser(username, password, ldapSettings)
	if err != nil {
		if errors.Is(err, httperrors.ErrUnauthorized) {
			return httperror.NewError(http.StatusUnprocessableEntity, "Invalid credentials", httperrors.ErrUnauthorized)
		}

		return httperror.InternalServerError("Unable to authenticate user against LDAP", err)
	}

	if user == nil {
		user = &portainer.User{
			Username:                username,
			Role:                    portainer.StandardUserRole,
			PortainerAuthorizations: authorization.DefaultPortainerAuthorizations(),
		}

		err = handler.DataStore.User().Create(user)
		if err != nil {
			return httperror.InternalServerError("Unable to persist user inside the database", err)
		}
	}

	err = handler.syncUserTeamsWithLDAPGroups(user, ldapSettings)
	if err != nil {
		log.Warn().Err(err).Msg("unable to automatically sync user teams with ldap")
	}

	return handler.writeToken(w, user, false)
}

func (handler *Handler) writeToken(w http.ResponseWriter, user *portainer.User, forceChangePassword bool) *httperror.HandlerError {
	tokenData := composeTokenData(user, forceChangePassword)

	return handler.persistAndWriteToken(w, tokenData)
}

func (handler *Handler) persistAndWriteToken(w http.ResponseWriter, tokenData *portainer.TokenData) *httperror.HandlerError {
	token, expirationTime, err := handler.JWTService.GenerateToken(tokenData)
	if err != nil {
		return httperror.InternalServerError("Unable to generate JWT token", err)
	}

	security.AddAuthCookie(w, token, expirationTime)

	return response.JSON(w, &authenticateResponse{JWT: token})

}

func (handler *Handler) syncUserTeamsWithLDAPGroups(user *portainer.User, settings *portainer.LDAPSettings) error {
	// only sync if there is a group base DN
	if len(settings.GroupSearchSettings) == 0 || len(settings.GroupSearchSettings[0].GroupBaseDN) == 0 {
		return nil
	}

	teams, err := handler.DataStore.Team().ReadAll()
	if err != nil {
		return err
	}

	userGroups, err := handler.LDAPService.GetUserGroups(user.Username, settings)
	if err != nil {
		return err
	}

	userMemberships, err := handler.DataStore.TeamMembership().TeamMembershipsByUserID(user.ID)
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

			err := handler.DataStore.TeamMembership().Create(membership)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func teamExists(teamName string, ldapGroups []string) bool {
	for _, group := range ldapGroups {
		if strings.EqualFold(group, teamName) {
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

func composeTokenData(user *portainer.User, forceChangePassword bool) *portainer.TokenData {
	return &portainer.TokenData{
		ID:                  user.ID,
		Username:            user.Username,
		Role:                user.Role,
		ForceChangePassword: forceChangePassword,
	}
}
