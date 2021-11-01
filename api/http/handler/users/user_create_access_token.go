package users

import (
	"crypto/sha256"
	"errors"
	"net/http"
	"time"

	"github.com/asaskevich/govalidator"
	"github.com/gorilla/securecookie"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

type userAccessTokenCreatePayload struct {
	Description string `validate:"required" example:"github-api-key" json:"description"`
}

func (payload *userAccessTokenCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Description) || govalidator.Contains(payload.Description, " ") {
		return errors.New("Invalid description. Must not contain any whitespace")
	}
	return nil
}

type accessTokenResponse struct {
	APIKey []byte `json:"apiKey"`
}

// @id UserGenerateAPIKey
// @summary Generate an API key for a user
// @description Generates an API key for a user.
// @description Only the calling user can generate a token for themselves.
// @description **Access policy**: restricted
// @tags users
// @security jwt
// @accept json
// @produce json
// @param body body userAccessTokenCreatePayload true "details"
// @success 200 {object} accessTokenResponse "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "User not found"
// @failure 500 "Server error"
// @router /users/{id}/tokens [post]
func (handler *Handler) userCreateAccessToken(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	// specifically require JWT auth for this endpoint since API-Key based auth is not supported
	t := handler.bouncer.JWTAuthLookup(r)
	if t == nil {
		return &httperror.HandlerError{http.StatusUnauthorized, "", errors.New("JWT Authentication required")}
	}

	var payload userAccessTokenCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid user identifier route variable", err}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user authentication token", err}
	}

	if tokenData.ID != portainer.UserID(userID) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to create user access token", httperrors.ErrUnauthorized}
	}

	user, err := handler.DataStore.User().User(portainer.UserID(userID))
	if err != nil {
		if err == bolterrors.ErrObjectNotFound {
			return &httperror.HandlerError{http.StatusNotFound, "Unable to find a user with the specified identifier inside the database", err}
		}
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a user with the specified identifier inside the database", err}
	}

	rawAPIKey, apiKey := generateApiKey(user.ID, payload)
	err = handler.DataStore.APIKeyRepository().CreateKey(&apiKey)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist api-key to the database", err}
	}

	return response.JSON(w, accessTokenResponse{rawAPIKey})
}

// generateApiKey generates an API key for a user; returns rawApiKey (for one-time display) - along with the APIKey struct.
func generateApiKey(userID portainer.UserID, payload userAccessTokenCreatePayload) ([]byte, portainer.APIKey) {
	rawAPIKey := securecookie.GenerateRandomKey(32)
	rawAPIKeyChars := []rune(string(rawAPIKey))
	hashDigest := sha256.Sum256(rawAPIKey)
	apiKey := portainer.APIKey{
		UserID:      userID,
		Description: payload.Description,
		Prefix:      [3]rune{rawAPIKeyChars[0], rawAPIKeyChars[1], rawAPIKeyChars[2]},
		DateCreated: time.Now(),
		Digest:      hashDigest,
	}
	return rawAPIKey, apiKey
}
