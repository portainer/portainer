package users

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
)

// @id UserAdminCheck
// @summary Check administrator account existence
// @description Check if an administrator account exists in the database.
// @description **Access policy**: public
// @tags users
// @success 204 "Success"
// @failure 404 "User not found"
// @router /users/admin/check [get]
func (handler *Handler) adminCheck(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	users, err := handler.DataStore.User().UsersByRole(portainer.AdministratorRole)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve users from the database", err}
	}

	if len(users) == 0 {
		return &httperror.HandlerError{http.StatusNotFound, "No administrator account found inside the database", errors.ErrObjectNotFound}
	}

	return response.Empty(w)
}
