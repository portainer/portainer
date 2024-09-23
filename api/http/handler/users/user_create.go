package users

import (
	"errors"
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type userCreatePayload struct {
	Username string `validate:"required" example:"bob"`
	Password string `validate:"required" example:"cg9Wgky3"`
	// User role (1 for administrator account and 2 for regular account)
	Role int `validate:"required" enums:"1,2" example:"2"`
}

func (payload *userCreatePayload) Validate(r *http.Request) error {
	if len(payload.Username) == 0 || strings.Contains(payload.Username, " ") {
		return errors.New("Invalid username. Must not contain any whitespace")
	}

	if payload.Role != 1 && payload.Role != 2 {
		return errors.New("Invalid role value. Value must be one of: 1 (administrator) or 2 (regular user)")
	}

	return nil
}

// @id UserCreate
// @summary Create a new user
// @description Create a new Portainer user.
// @description Only administrators can create users.
// @description **Access policy**: restricted
// @tags users
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body userCreatePayload true "User details"
// @success 200 {object} portainer.User "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 409 "User already exists"
// @failure 500 "Server error"
// @router /users [post]
func (handler *Handler) userCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload userCreatePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	var user *portainer.User

	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var err error
		user, err = handler.createUser(tx, payload)

		return err
	}); err != nil {
		var httpErr *httperror.HandlerError
		if errors.As(err, &httpErr) {
			return httpErr
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.JSON(w, user)
}

func (handler *Handler) createUser(tx dataservices.DataStoreTx, payload userCreatePayload) (*portainer.User, error) {
	user, err := tx.User().UserByUsername(payload.Username)
	if err != nil && !tx.IsErrObjectNotFound(err) {
		return nil, httperror.InternalServerError("Unable to retrieve users from the database", err)
	}

	if user != nil {
		return nil, httperror.Conflict("Another user with the same username already exists", errUserAlreadyExists)
	}

	user = &portainer.User{
		Username: payload.Username,
		Role:     portainer.UserRole(payload.Role),
	}

	settings, err := tx.Settings().Settings()
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve settings from the database", err)
	}

	// When LDAP/OAuth is on, can only add users without password
	if (settings.AuthenticationMethod == portainer.AuthenticationLDAP || settings.AuthenticationMethod == portainer.AuthenticationOAuth) && payload.Password != "" {
		errMsg := "a user with password can not be created when authentication method is Oauth or LDAP"
		return nil, httperror.BadRequest(errMsg, errors.New(errMsg))
	}

	if settings.AuthenticationMethod == portainer.AuthenticationInternal {
		if !handler.passwordStrengthChecker.Check(payload.Password) {
			return nil, httperror.BadRequest("Password does not meet the requirements", nil)
		}

		user.Password, err = handler.CryptoService.Hash(payload.Password)
		if err != nil {
			return nil, httperror.InternalServerError("Unable to hash user password", errCryptoHashFailure)
		}
	}

	if err := tx.User().Create(user); err != nil {
		return nil, httperror.InternalServerError("Unable to persist user inside the database", err)
	}

	hideFields(user)

	return user, nil
}
