package auth

import (
	"log"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/portainer"
)

func (handler *Handler) authenticateOAuth(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload oauthPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	if settings.AuthenticationMethod != 3 {
		return &httperror.HandlerError{http.StatusForbidden, "OAuth authentication is not being used", err}
	}

	token, err := handler.OAuthService.GetAccessToken(payload.Code, &settings.OAuthSettings)
	if err != nil {
		log.Printf("[DEBUG] - Failed retrieving access token: %v", err)
		return &httperror.HandlerError{http.StatusUnprocessableEntity, "Invalid access token", portainer.ErrUnauthorized}
	}

	username, err := handler.OAuthService.GetUsername(token, &settings.OAuthSettings)
	if err != nil {
		log.Printf("[DEBUG] - Failed acquiring username: %v", err)
		return &httperror.HandlerError{http.StatusForbidden, "Unable to acquire username", portainer.ErrUnauthorized}
	}

	u, err := handler.UserService.UserByUsername(username)
	if err != nil && err != portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve a user with the specified username from the database", err}
	}

	if u == nil && !settings.OAuthSettings.OAuthAutoCreateUsers {
		return &httperror.HandlerError{http.StatusForbidden, "Unregistered account", portainer.ErrUnauthorized}
	}

	if u == nil {
		user := &portainer.User{
			Username: username,
			Role:     portainer.StandardUserRole,
		}

		err = handler.UserService.CreateUser(user)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist user inside the database", err}
		}

		return handler.writeToken(w, user)
	}

	return handler.writeToken(w, u)
}
