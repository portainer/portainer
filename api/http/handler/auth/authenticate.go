package auth

import (
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
		return &httperror.HandlerError{ErrAuthDisabled, "Cannot authenticate user. Portainer was started with the --no-auth flag", http.StatusServiceUnavailable}
	}

	var payload authenticatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{err, "Invalid request payload", http.StatusBadRequest}
	}

	u, err := handler.UserService.UserByUsername(payload.Username)
	if err == portainer.ErrUserNotFound {
		return &httperror.HandlerError{ErrInvalidCredentials, "Invalid credentials", http.StatusBadRequest}
	} else if err != nil {
		return &httperror.HandlerError{err, "Unable to retrieve a user with the specified username from the database", http.StatusInternalServerError}
	}

	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{err, "Unable to retrieve settings from the database", http.StatusInternalServerError}
	}

	if settings.AuthenticationMethod == portainer.AuthenticationLDAP && u.ID != 1 {
		err = handler.LDAPService.AuthenticateUser(payload.Username, payload.Password, &settings.LDAPSettings)
		if err != nil {
			return &httperror.HandlerError{err, "Unable to authenticate user via LDAP/AD", http.StatusInternalServerError}
		}
	} else {
		err = handler.CryptoService.CompareHashAndData(u.Password, payload.Password)
		if err != nil {
			return &httperror.HandlerError{ErrInvalidCredentials, "Invalid credentials", http.StatusUnprocessableEntity}
		}
	}

	tokenData := &portainer.TokenData{
		ID:       u.ID,
		Username: u.Username,
		Role:     u.Role,
	}

	token, err := handler.JWTService.GenerateToken(tokenData)
	if err != nil {
		return &httperror.HandlerError{err, "Unable to generate JWT token", http.StatusInternalServerError}
	}

	return response.WriteJSONResponse(w, &authenticateResponse{JWT: token})
}
