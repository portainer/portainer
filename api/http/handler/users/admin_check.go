package users

import (
	"net/http"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/response"
)

// GET request on /api/users/admin/check
func (handler *Handler) adminCheck(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	users, err := handler.UserService.UsersByRole(portainer.AdministratorRole)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve users from the database", err}
	}

	if len(users) == 0 {
		return &httperror.HandlerError{http.StatusNotFound, "No administrator account found inside the database", portainer.ErrObjectNotFound}
	}

	return response.Empty(w)
}
