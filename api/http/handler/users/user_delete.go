package users

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/security"
)

// @summary Delete a user
// @description
// @tags users
// @security jwt
// @accept json
// @produce json
// @param id path int true "user id"
// @success 204
// @failure 400,403,500
// @router /users/{id} [delete]
func (handler *Handler) userDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid user identifier route variable", err}
	}

	if userID == 1 {
		return &httperror.HandlerError{http.StatusForbidden, "Cannot remove the initial admin account", errors.New("Cannot remove the initial admin account")}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user authentication token", err}
	}

	if tokenData.ID == portainer.UserID(userID) {
		return &httperror.HandlerError{http.StatusForbidden, "Cannot remove your own user account. Contact another administrator", errAdminCannotRemoveSelf}
	}

	user, err := handler.DataStore.User().User(portainer.UserID(userID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a user with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a user with the specified identifier inside the database", err}
	}

	if user.Role == portainer.AdministratorRole {
		return handler.deleteAdminUser(w, user)
	}

	return handler.deleteUser(w, user)
}

func (handler *Handler) deleteAdminUser(w http.ResponseWriter, user *portainer.User) *httperror.HandlerError {
	if user.Password == "" {
		return handler.deleteUser(w, user)
	}

	users, err := handler.DataStore.User().Users()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve users from the database", err}
	}

	localAdminCount := 0
	for _, u := range users {
		if u.Role == portainer.AdministratorRole && u.Password != "" {
			localAdminCount++
		}
	}

	if localAdminCount < 2 {
		return &httperror.HandlerError{http.StatusInternalServerError, "Cannot remove local administrator user", errCannotRemoveLastLocalAdmin}
	}

	return handler.deleteUser(w, user)
}

func (handler *Handler) deleteUser(w http.ResponseWriter, user *portainer.User) *httperror.HandlerError {
	err := handler.DataStore.User().DeleteUser(user.ID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove user from the database", err}
	}

	err = handler.DataStore.TeamMembership().DeleteTeamMembershipByUserID(user.ID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove user memberships from the database", err}
	}

	return response.Empty(w)
}
