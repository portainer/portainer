package authorizationsets

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type roleCreatePayload struct {
	Name string
}

func (payload *roleCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid authorization set name")
	}
	return nil
}

func (handler *Handler) roleCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload roleCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	role := &portainer.Role{
		Name: payload.Name,
	}

	err = handler.RoleService.CreateRole(role)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the authorization set inside the database", err}
	}

	return response.JSON(w, role)
}
