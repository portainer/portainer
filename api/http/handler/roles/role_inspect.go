package roles

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// GET request on /api/authorization sets/:id
func (handler *Handler) roleInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	roleID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid authorization set identifier route variable", err}
	}

	role, err := handler.RoleService.Role(portainer.RoleID(roleID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a authorization set with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a authorization set with the specified identifier inside the database", err}
	}

	return response.JSON(w, role)
}
