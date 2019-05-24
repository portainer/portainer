package roles

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// GET request on /api/Role
func (handler *Handler) roleList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	roles, err := handler.RoleService.Roles()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve authorization sets from the database", err}
	}

	return response.JSON(w, roles)
}
