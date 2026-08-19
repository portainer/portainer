package users

import (
	"errors"
	"fmt"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/portainer/portainer/pkg/validate"
)

type userAccessTokenCreatePayload struct {
	Password    string `validate:"required" example:"password" json:"password"`
	Description string `validate:"required" example:"github-api-key" json:"description"`
}

func (payload *userAccessTokenCreatePayload) Validate(r *http.Request) error {
	if len(payload.Description) == 0 {
		return errors.New("invalid description: cannot be empty")
	}
	if validate.HasWhitespaceOnly(payload.Description) {
		return errors.New("invalid description: cannot contain only whitespaces")
	}
	if validate.MinStringLength(payload.Description, 128) {
		return errors.New("invalid description: cannot be longer than 128 characters")
	}
	return nil
}

type accessTokenResponse struct {
	RawAPIKey string           `json:"rawAPIKey"`
	APIKey    portainer.APIKey `json:"apiKey"`
}

// @id UserGenerateAPIKey
// @summary Generate an API key for a user
// @description Generates an API key for a user.
// @description Only the calling user can generate a token for themselves.
// @description Password is required only for internal authentication.
// @description **Access policy**: restricted
// @tags users
// @security jwt
// @accept json
// @produce json
// @param id path int true "User identifier"
// @param body body userAccessTokenCreatePayload true "details"
// @success 200 {object} accessTokenResponse "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized"
// @failure 403 "Permission denied"
// @failure 404 "User not found"
// @failure 500 "Server error"
// @router /users/{id}/tokens [post]
func (handler *Handler) userCreateAccessToken(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	// specifically require Cookie auth for this endpoint since API-Key based auth is not supported
	jwt, _ := handler.bouncer.CookieAuthLookup(r)
	if jwt == nil {
		jwt, _ = handler.bouncer.JWTAuthLookup(r)
	}

	if jwt == nil {
		return httperror.Unauthorized("Auth not supported", errors.New("Authentication required"))
	}

	var payload userAccessTokenCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid user identifier route variable", err)
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user authentication token", err)
	}

	if tokenData.ID != portainer.UserID(userID) {
		return httperror.Forbidden("Permission denied to create user access token", httperrors.ErrUnauthorized)
	}

	user, err := handler.DataStore.User().Read(portainer.UserID(userID))
	if err != nil {
		return httperror.InternalServerError("Unable to find a user with the specified identifier inside the database", err)
	}

	internalAuth, err := handler.usesInternalAuthentication(portainer.UserID(userID))
	if err != nil {
		return httperror.InternalServerError("Unable to determine the authentication method", err)
	}

	if internalAuth {
		// Internal auth requires the password field and must not be empty
		if len(payload.Password) == 0 {
			return httperror.BadRequest("Invalid request payload", errors.New("invalid password: cannot be empty"))
		}

		err = handler.CryptoService.CompareHashAndData(user.Password, payload.Password)
		if err != nil {
			return httperror.Forbidden("Current password doesn't match", errors.New("Current password does not match the password provided. Please try again"))
		}
	}

	rawAPIKey, apiKey, err := handler.apiKeyService.GenerateApiKey(*user, payload.Description)
	if err != nil {
		return httperror.InternalServerError("Internal Server Error", err)
	}

	return response.JSONWithStatus(w, accessTokenResponse{rawAPIKey, *apiKey}, http.StatusOK)
}

func (handler *Handler) usesInternalAuthentication(userid portainer.UserID) (bool, error) {
	// userid 1 is the admin user and always uses internal auth
	if userid == 1 {
		return true, nil
	}

	// otherwise determine the auth method from the settings
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return false, fmt.Errorf("unable to retrieve the settings from the database: %w", err)
	}

	return settings.AuthenticationMethod == portainer.AuthenticationInternal, nil
}
