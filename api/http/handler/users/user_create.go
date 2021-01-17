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

type userCreatePayload struct {
	Username string
	Password string
	Role     int
}

func (payload *userCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Username) || govalidator.Contains(payload.Username, " ") {
		return errors.New("Invalid username. Must not contain any whitespace")
	}

	if payload.Role != 1 && payload.Role != 2 {
		return errors.New("Invalid role value. Value must be one of: 1 (administrator) or 2 (regular user)")
	}
	return nil
}

// @summary Create a user
// @description
// @security ApiKeyAuth
// @tags users
// @accept json
// @produce json
// @param body body userCreatePayload true "User data"
// @success 200 {object} portainer.User
// @failure 400,403,409,500
// @router /users [post]
func (handler *Handler) userCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload userCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if !securityContext.IsAdmin && !securityContext.IsTeamLeader {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to create user", httperrors.ErrResourceAccessDenied}
	}

	if securityContext.IsTeamLeader && payload.Role == 1 {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to create administrator user", httperrors.ErrResourceAccessDenied}
	}

	user, err := handler.DataStore.User().UserByUsername(payload.Username)
	if err != nil && err != bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve users from the database", err}
	}
	if user != nil {
		return &httperror.HandlerError{http.StatusConflict, "Another user with the same username already exists", errUserAlreadyExists}
	}

	user = &portainer.User{
		Username: payload.Username,
		Role:     portainer.UserRole(payload.Role),
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	if settings.AuthenticationMethod == portainer.AuthenticationInternal {
		user.Password, err = handler.CryptoService.Hash(payload.Password)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to hash user password", errCryptoHashFailure}
		}
	}

	err = handler.DataStore.User().CreateUser(user)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist user inside the database", err}
	}

	hideFields(user)
	return response.JSON(w, user)
}
