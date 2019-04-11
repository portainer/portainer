package roles

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type roleUpdatePayload struct {
	Name string
}

func (payload *roleUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/Role/:id
func (handler *Handler) roleUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	roleID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid authorization set identifier route variable", err}
	}

	var payload roleUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	role, err := handler.RoleService.Role(portainer.RoleID(roleID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a authorization set with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a authorization set with the specified identifier inside the database", err}
	}

	if payload.Name != "" {
		role.Name = payload.Name
	}

	err = handler.RoleService.UpdateRole(role.ID, role)
	if err != nil {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to persist authorization set changes inside the database", err}
	}

	return response.JSON(w, role)
}
