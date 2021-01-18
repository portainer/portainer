package roles

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// @id RoleList
// @summary List roles
// @description List all roles available for use
// @description **Access policy**: administrator
// @tags roles
// @security jwt
// @produce json
// @param id path int true "identifier"
// @param body body Object true "details"
// @success 200 {array} portainer.Role "Success"
// @failure 500 "Server error"
// @router /roles [get]
func (handler *Handler) roleList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	roles, err := handler.DataStore.Role().Roles()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve authorization sets from the database", err}
	}

	return response.JSON(w, roles)
}
