package auth

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"

	"github.com/asaskevich/govalidator"
	"github.com/rs/zerolog/log"
)

type oauthPayload struct {
	// OAuth code returned from OAuth Provided
	Code string
}

func (payload *oauthPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Code) {
		return errors.New("Invalid OAuth authorization code")
	}
	return nil
}

func (handler *Handler) authenticateOAuth(code string, settings *portainer.OAuthSettings) (string, error) {
	if code == "" {
		return "", errors.New("Invalid OAuth authorization code")
	}

	if settings == nil {
		return "", errors.New("Invalid OAuth configuration")
	}

	username, err := handler.OAuthService.Authenticate(code, settings)
	if err != nil {
		return "", err
	}

	return username, nil
}

// @id ValidateOAuth
// @summary Authenticate with OAuth
// @description **Access policy**: public
// @tags auth
// @accept json
// @produce json
// @param body body oauthPayload true "OAuth Credentials used for authentication"
// @success 200 {object} authenticateResponse "Success"
// @failure 400 "Invalid request"
// @failure 422 "Invalid Credentials"
// @failure 500 "Server error"
// @router /auth/oauth/validate [post]
func (handler *Handler) validateOAuth(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload oauthPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve settings from the database", err)
	}

	if settings.AuthenticationMethod != portainer.AuthenticationOAuth {
		return httperror.Forbidden("OAuth authentication is not enabled", errors.New("OAuth authentication is not enabled"))
	}

	username, err := handler.authenticateOAuth(payload.Code, &settings.OAuthSettings)
	if err != nil {
		log.Debug().Err(err).Msg("OAuth authentication error")

		return httperror.InternalServerError("Unable to authenticate through OAuth", httperrors.ErrUnauthorized)
	}

	user, err := handler.DataStore.User().UserByUsername(username)
	if err != nil && !handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.InternalServerError("Unable to retrieve a user with the specified username from the database", err)
	}

	if user == nil && !settings.OAuthSettings.OAuthAutoCreateUsers {
		return httperror.Forbidden("Account not created beforehand in Portainer and automatic user provisioning not enabled", httperrors.ErrUnauthorized)
	}

	if user == nil {
		user = &portainer.User{
			Username: username,
			Role:     portainer.StandardUserRole,
		}

		err = handler.DataStore.User().Create(user)
		if err != nil {
			return httperror.InternalServerError("Unable to persist user inside the database", err)
		}

		if settings.OAuthSettings.DefaultTeamID != 0 {
			membership := &portainer.TeamMembership{
				UserID: user.ID,
				TeamID: settings.OAuthSettings.DefaultTeamID,
				Role:   portainer.TeamMember,
			}

			err = handler.DataStore.TeamMembership().Create(membership)
			if err != nil {
				return httperror.InternalServerError("Unable to persist team membership inside the database", err)
			}
		}

	}

	return handler.writeToken(w, user, false)
}
