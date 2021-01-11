package roles

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// @summary List Roles
// @description
// @tags Roles
// @security ApiKeyAuth
// @accept json
// @produce json
// @success 200 {array} portainer.Role "Roles"
// @failure 500
// @router /roles [get]
func (handler *Handler) roleList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	roles, err := handler.DataStore.Role().Roles()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve authorization sets from the database", err}
	}

	return response.JSON(w, roles)
}
