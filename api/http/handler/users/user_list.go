package users

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/security"
)

// @summary List users
// @description
// @tags users
// @security ApiKeyAuth
// @accept json
// @produce json
// @success 200 {array} portainer.User
// @failure 500
// @router /users [get]
func (handler *Handler) userList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	users, err := handler.DataStore.User().Users()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve users from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	filteredUsers := security.FilterUsers(users, securityContext)

	for idx := range filteredUsers {
		hideFields(&filteredUsers[idx])
	}

	return response.JSON(w, filteredUsers)
}
