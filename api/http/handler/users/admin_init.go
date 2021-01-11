package users

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type adminInitPayload struct {
	Username string
	Password string
}

func (payload *adminInitPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Username) || govalidator.Contains(payload.Username, " ") {
		return errors.New("Invalid username. Must not contain any whitespace")
	}
	if govalidator.IsNull(payload.Password) {
		return errors.New("Invalid password")
	}
	return nil
}

// @summary Create an initial admin user
// @description Creates a new admin user if not exists
// @tags Users
// @accept json
// @produce json
// @param body body adminInitPayload true "User data"
// @success 200 {object} portainer.User
// @failure 400,409,500
// @router /users/admin/init [post]
func (handler *Handler) adminInit(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload adminInitPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	users, err := handler.DataStore.User().UsersByRole(portainer.AdministratorRole)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve users from the database", err}
	}

	if len(users) != 0 {
		return &httperror.HandlerError{http.StatusConflict, "Unable to create administrator user", errAdminAlreadyInitialized}
	}

	user := &portainer.User{
		Username: payload.Username,
		Role:     portainer.AdministratorRole,
	}

	user.Password, err = handler.CryptoService.Hash(payload.Password)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to hash user password", errCryptoHashFailure}
	}

	err = handler.DataStore.User().CreateUser(user)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist user inside the database", err}
	}

	return response.JSON(w, user)
}
