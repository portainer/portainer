package users

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	portainererrors "github.com/portainer/portainer/api/internal/errors"
)

type userUpdatePasswordPayload struct {
	Password    string
	NewPassword string
}

func (payload *userUpdatePasswordPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Password) {
		return errors.New("Invalid current password")
	}
	if govalidator.IsNull(payload.NewPassword) {
		return errors.New("Invalid new password")
	}
	return nil
}

// PUT request on /api/users/:id/passwd
func (handler *Handler) userUpdatePassword(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid user identifier route variable", err}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user authentication token", err}
	}

	if tokenData.Role != portainer.AdministratorRole && tokenData.ID != portainer.UserID(userID) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to update user", errors.New(portainererrors.ErrUnauthorized)}
	}

	var payload userUpdatePasswordPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	user, err := handler.DataStore.User().User(portainer.UserID(userID))
	if err.Error() == portainererrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a user with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a user with the specified identifier inside the database", err}
	}

	err = handler.CryptoService.CompareHashAndData(user.Password, payload.Password)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Specified password do not match actual password", errors.New(portainererrors.ErrUnauthorized)}
	}

	user.Password, err = handler.CryptoService.Hash(payload.NewPassword)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to hash user password", errors.New(portainererrors.ErrCryptoHashFailure)}
	}

	err = handler.DataStore.User().UpdateUser(user.ID, user)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist user changes inside the database", err}
	}

	return response.Empty(w)
}
