package users

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

type userUpdatePayload struct {
	Username string
	Password string
	Role     int
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

// @summary Update a user
// @description
// @tags users
// @security ApiKeyAuth
// @accept json
// @produce json
// @param id path int true "user id"
// @param body body userUpdatePayload true "user password data"
// @success 200 {object} portainer.User "User updated"
// @failure 400,403,404,409,500
// @router /users/{id} [put]
// PUT request on /api/users/:id
func (handler *Handler) userUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid user identifier route variable", err}
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
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a user with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a user with the specified identifier inside the database", err}
	}

	if payload.Username != "" && payload.Username != user.Username {
		sameNameUser, err := handler.DataStore.User().UserByUsername(payload.Username)
		if err != nil && err != bolterrors.ErrObjectNotFound {
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
	}

	if payload.Role != 0 {
		user.Role = portainer.UserRole(payload.Role)
	}

	err = handler.DataStore.User().UpdateUser(user.ID, user)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist user changes inside the database", err}
	}

	return response.JSON(w, user)
}
