package users

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

// @id UserRemoveAPIKey
// @summary Remove an api-key associated to a user
// @description Remove an api-key associated to a user..
// @description Only the calling user or admin can remove api-key.
// @description **Access policy**: authenticated
// @tags users
// @security ApiKeyAuth
// @security jwt
// @param id path int true "User identifier"
// @param keyID path int true "Api Key identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Not found"
// @failure 500 "Server error"
// @router /users/{id}/tokens/{keyID} [delete]
func (handler *Handler) userRemoveAccessToken(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid user identifier route variable", err}
	}

	apiKeyID, err := request.RetrieveNumericRouteVariableValue(r, "keyID")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid api-key identifier route variable", err}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user authentication token", err}
	}
	if tokenData.Role != portainer.AdministratorRole && tokenData.ID != portainer.UserID(userID) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to get user access tokens", httperrors.ErrUnauthorized}
	}

	_, err = handler.DataStore.User().User(portainer.UserID(userID))
	if err != nil {
		if handler.DataStore.IsErrObjectNotFound(err) {
			return &httperror.HandlerError{http.StatusNotFound, "Unable to find a user with the specified identifier inside the database", err}
		}
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a user with the specified identifier inside the database", err}
	}

	// check if the key exists and the key belongs to the user
	apiKey, err := handler.apiKeyService.GetAPIKey(portainer.APIKeyID(apiKeyID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "API Key not found", err}
	}
	if apiKey.UserID != portainer.UserID(userID) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to remove api-key", httperrors.ErrUnauthorized}
	}

	err = handler.apiKeyService.DeleteAPIKey(portainer.APIKeyID(apiKeyID))
	if err != nil {
		if err == apikey.ErrInvalidAPIKey {
			return &httperror.HandlerError{http.StatusNotFound, "Unable to find an api-key with the specified identifier inside the database", err}
		}
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the api-key from the user", err}
	}

	return response.Empty(w)
}
