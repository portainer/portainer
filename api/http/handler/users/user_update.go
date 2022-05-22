package users

import (
	"errors"
	"net/http"
	"time"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

type userUpdatePayload struct {
	Username  string `validate:"required" example:"bob"`
	Password  string `validate:"required" example:"cg9Wgky3"`
	UserTheme string `example:"dark"`
	// User role (1 for administrator account and 2 for regular account)
	Role int `validate:"required" enums:"1,2" example:"2"`
}

func (payload *userUpdatePayload) Validate(r *http.Request) error {
	if govalidator.Contains(payload.Username, " ") {
		return errors.New("Invalid username. Must not contain any whitespace")
	}

	if payload.Role != 0 && payload.Role != 1 && payload.Role != 2 {
		return errors.New("Invalid role value. Value must be one of: 1 (administrator) or 2 (regular user)")
	}
	return nil
}

// @id UserUpdate
// @summary Update a user
// @description Update user details. A regular user account can only update his details.
// @description **Access policy**: authenticated
// @tags users
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "User identifier"
// @param body body userUpdatePayload true "User details"
// @success 200 {object} portainer.User "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "User not found"
// @failure 409 "Username already exist"
// @failure 500 "Server error"
// @router /users/{id} [put]
func (handler *Handler) userUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid user identifier route variable", err}
	}

	if handler.demoService.IsDemoUser(portainer.UserID(userID)) {
		return &httperror.HandlerError{http.StatusForbidden, httperrors.ErrNotAvailableInDemo.Error(), httperrors.ErrNotAvailableInDemo}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user authentication token", err}
	}

	if tokenData.Role != portainer.AdministratorRole && tokenData.ID != portainer.UserID(userID) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to update user", httperrors.ErrUnauthorized}
	}

	var payload userUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	if tokenData.Role != portainer.AdministratorRole && payload.Role != 0 {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to update user to administrator role", httperrors.ErrResourceAccessDenied}
	}

	user, err := handler.DataStore.User().User(portainer.UserID(userID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a user with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a user with the specified identifier inside the database", err}
	}

	if payload.Username != "" && payload.Username != user.Username {
		sameNameUser, err := handler.DataStore.User().UserByUsername(payload.Username)
		if err != nil && !handler.DataStore.IsErrObjectNotFound(err) {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve users from the database", err}
		}
		if sameNameUser != nil && sameNameUser.ID != portainer.UserID(userID) {
			return &httperror.HandlerError{http.StatusConflict, "Another user with the same username already exists", errUserAlreadyExists}
		}

		user.Username = payload.Username
	}

	if payload.Password != "" {
		user.Password, err = handler.CryptoService.Hash(payload.Password)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to hash user password", errCryptoHashFailure}
		}
		user.TokenIssueAt = time.Now().Unix()
	}

	if payload.Role != 0 {
		user.Role = portainer.UserRole(payload.Role)
	}

	if payload.UserTheme != "" {
		user.UserTheme = payload.UserTheme
	}

	err = handler.DataStore.User().UpdateUser(user.ID, user)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist user changes inside the database", err}
	}

	// remove all of the users persisted API keys
	handler.apiKeyService.InvalidateUserKeyCache(user.ID)
	return response.JSON(w, user)
}
