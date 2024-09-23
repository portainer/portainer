package users

import (
	"cmp"
	"errors"
	"net/http"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type themePayload struct {
	// Color represents the color theme of the UI
	Color *string `json:"color" example:"dark" enums:"dark,light,highcontrast,auto"`
}

type userUpdatePayload struct {
	Username    string `validate:"required" example:"bob"`
	Password    string `validate:"required" example:"cg9Wgky3"`
	NewPassword string `validate:"required" example:"asfj2emv"`
	UseCache    *bool  `validate:"required" example:"true"`
	Theme       *themePayload

	// User role (1 for administrator account and 2 for regular account)
	Role int `validate:"required" enums:"1,2" example:"2"`
}

func (payload *userUpdatePayload) Validate(r *http.Request) error {
	if strings.Contains(payload.Username, " ") {
		return errors.New("invalid username. Must not contain any whitespace")
	}

	if payload.Role != 0 && payload.Role != 1 && payload.Role != 2 {
		return errors.New("invalid role value. Value must be one of: 1 (administrator) or 2 (regular user)")
	}

	return nil
}

// @id UserUpdate
// @summary Update a user
// @description Update user details. A regular user account can only update his details.
// @description A regular user account cannot change their username or role.
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
		return httperror.BadRequest("Invalid user identifier route variable", err)
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user authentication token", err)
	}

	if tokenData.Role != portainer.AdministratorRole && tokenData.ID != portainer.UserID(userID) {
		return httperror.Forbidden("Permission denied to update user", httperrors.ErrUnauthorized)
	}

	var payload userUpdatePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	if tokenData.Role != portainer.AdministratorRole && payload.Role != 0 {
		return httperror.Forbidden("Permission denied to update user to administrator role", httperrors.ErrResourceAccessDenied)
	}

	user, err := handler.DataStore.User().Read(portainer.UserID(userID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a user with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a user with the specified identifier inside the database", err)
	}

	if payload.Username != "" && payload.Username != user.Username {
		if tokenData.Role != portainer.AdministratorRole {
			return httperror.Forbidden("Permission denied. Unable to update username", httperrors.ErrResourceAccessDenied)
		}

		if sameNameUser, err := handler.DataStore.User().UserByUsername(payload.Username); err != nil && !handler.DataStore.IsErrObjectNotFound(err) {
			return httperror.InternalServerError("Unable to retrieve users from the database", err)
		} else if sameNameUser != nil && sameNameUser.ID != portainer.UserID(userID) {
			return httperror.Conflict("Another user with the same username already exists", errUserAlreadyExists)
		}

		user.Username = payload.Username
	}

	if payload.Password != "" && payload.NewPassword == "" {
		if tokenData.Role == portainer.AdministratorRole {
			return httperror.BadRequest("Existing password field specified without new password field.", errors.New("To change the password as an admin, you only need 'newPassword' in your request"))
		}

		return httperror.BadRequest("Existing password field specified without new password field.", errors.New("To change the password, you must include both 'password' and 'newPassword' in your request"))
	}

	if payload.NewPassword != "" {
		// Non-admins need to supply the previous password
		if tokenData.Role != portainer.AdministratorRole {
			if err := handler.CryptoService.CompareHashAndData(user.Password, payload.Password); err != nil {
				return httperror.Forbidden("Current password doesn't match. Password left unchanged", errors.New("Current password does not match the password provided. Please try again"))
			}
		}

		if !handler.passwordStrengthChecker.Check(payload.NewPassword) {
			return httperror.BadRequest("Password does not meet the minimum strength requirements", nil)
		}

		user.Password, err = handler.CryptoService.Hash(payload.NewPassword)
		if err != nil {
			return httperror.InternalServerError("Unable to hash user password", errCryptoHashFailure)
		}
		user.TokenIssueAt = time.Now().Unix()
	}

	if payload.Theme != nil {
		user.ThemeSettings.Color = *cmp.Or(payload.Theme.Color, &user.ThemeSettings.Color)
	}

	user.UseCache = *cmp.Or(payload.UseCache, &user.UseCache)

	if payload.Role != 0 {
		user.Role = portainer.UserRole(payload.Role)
		user.TokenIssueAt = time.Now().Unix()
	}

	if err := handler.DataStore.User().Update(user.ID, user); err != nil {
		return httperror.InternalServerError("Unable to persist user changes inside the database", err)
	}

	// remove all of the users persisted API keys
	handler.apiKeyService.InvalidateUserKeyCache(user.ID)

	// hide the password field in the response payload
	user.Password = ""

	return response.JSON(w, user)
}
