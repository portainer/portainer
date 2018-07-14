package users

import (
	"net/http"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
	"github.com/portainer/portainer/http/security"
)

// DELETE request on /api/users/:id
func (handler *Handler) userDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid user identifier route variable", err}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user authentication token", err}
	}

	if tokenData.ID == portainer.UserID(userID) {
		return &httperror.HandlerError{http.StatusForbidden, "Cannot remove your own user account. Contact another administrator", portainer.ErrAdminCannotRemoveSelf}
	}

	users, err := handler.UserService.Users()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve users from the database", err}
	}
	var role portainer.UserRole
	var password string
	var adminsWithPassword = 0
	for _, user := range users {
		if portainer.UserID(userID) == user.ID {
			role = user.Role
			password = user.Password
		}
		if user.Role == portainer.AdministratorRole && user.Password != "" {
			adminsWithPassword++
		}
	}
	if role == portainer.AdministratorRole && password != "" && (adminsWithPassword-1) < 1 {
		return &httperror.HandlerError{http.StatusInternalServerError, "Cannot remove last local admin", portainer.ErrCannotRemoveLastLocalAdmin}
	}

	_, err = handler.UserService.User(portainer.UserID(userID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a user with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a user with the specified identifier inside the database", err}
	}

	err = handler.UserService.DeleteUser(portainer.UserID(userID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove user from the database", err}
	}

	err = handler.TeamMembershipService.DeleteTeamMembershipByUserID(portainer.UserID(userID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove user memberships from the database", err}
	}

	return response.Empty(w)
}
