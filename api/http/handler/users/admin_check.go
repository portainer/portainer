package users

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/errors"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
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
		return httperror.InternalServerError("Unable to retrieve users from the database", err)
	}

	if len(users) == 0 {
		return httperror.NotFound("No administrator account found inside the database", errors.ErrObjectNotFound)
	}

	return response.Empty(w)
}
