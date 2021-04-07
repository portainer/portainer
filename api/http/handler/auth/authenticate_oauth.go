package auth

import (
	"errors"
	"log"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/internal/authorization"
)

type oauthPayload struct {
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

func (handler *Handler) validateOAuth(w http.ResponseWriter, r *http.Request) (*authMiddlewareResponse, *httperror.HandlerError) {
	resp := &authMiddlewareResponse{
		Method: portainer.AuthenticationOAuth,
	}

	var payload oauthPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return resp, &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid request payload",
			Err:        err,
		}
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return resp, &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve settings from the database",
			Err:        err,
		}
	}

	if settings.AuthenticationMethod != 3 {
		return resp, &httperror.HandlerError{
			StatusCode: http.StatusForbidden,
			Message:    "OAuth authentication is not enabled",
			Err:        errors.New("OAuth authentication is not enabled"),
		}
	}

	username, err := handler.authenticateOAuth(payload.Code, &settings.OAuthSettings)
	if err != nil {
		log.Printf("[DEBUG] - OAuth authentication error: %s", err)
		return resp, &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to authenticate through OAuth",
			Err:        httperrors.ErrUnauthorized,
		}
	}

	resp.Username = username

	user, err := handler.DataStore.User().UserByUsername(username)
	if err != nil && err != bolterrors.ErrObjectNotFound {
		return resp, &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve a user with the specified username from the database",
			Err:        err,
		}
	}

	if user == nil && !settings.OAuthSettings.OAuthAutoCreateUsers {
		return resp, &httperror.HandlerError{
			StatusCode: http.StatusForbidden,
			Message:    "Account not created beforehand in Portainer and automatic user provisioning not enabled",
			Err:        httperrors.ErrUnauthorized,
		}
	}

	if user == nil {
		user = &portainer.User{
			Username:                username,
			Role:                    portainer.StandardUserRole,
			PortainerAuthorizations: authorization.DefaultPortainerAuthorizations(),
		}

		err = handler.DataStore.User().CreateUser(user)
		if err != nil {
			return resp, &httperror.HandlerError{
				StatusCode: http.StatusInternalServerError,
				Message:    "Unable to persist user inside the database",
				Err:        err,
			}
		}

		if settings.OAuthSettings.DefaultTeamID != 0 {
			membership := &portainer.TeamMembership{
				UserID: user.ID,
				TeamID: settings.OAuthSettings.DefaultTeamID,
				Role:   portainer.TeamMember,
			}

			err = handler.DataStore.TeamMembership().CreateTeamMembership(membership)
			if err != nil {
				return &authMiddlewareResponse{
						Method: portainer.AuthenticationOAuth,
					}, &httperror.HandlerError{
						StatusCode: http.StatusInternalServerError,
						Message:    "Unable to persist team membership inside the database",
						Err:        err,
					}
			}
		}

		err = handler.AuthorizationService.UpdateUsersAuthorizations()
		if err != nil {
			return resp, &httperror.HandlerError{
				StatusCode: http.StatusInternalServerError,
				Message:    "Unable to update user authorizations",
				Err:        err,
			}
		}
	}

	info := handler.LicenseService.Info()

	if user.Role != portainer.AdministratorRole && !info.Valid {
		return resp, &httperror.HandlerError{
			StatusCode: http.StatusForbidden,
			Message:    "License is not valid",
			Err:        httperrors.ErrNoValidLicense,
		}
	}

	return handler.writeToken(w, user, portainer.AuthenticationOAuth)
}
