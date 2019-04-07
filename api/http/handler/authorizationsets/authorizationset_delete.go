package authorizationsets

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// DELETE request on /api/authorizationSets/:id
func (handler *Handler) authorizationSetDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	authorizationSetID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid authorization set identifier route variable", err}
	}

	_, err = handler.AuthorizationSetService.AuthorizationSet(portainer.AuthorizationSetID(authorizationSetID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a authorization set with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a authorization set with the specified identifier inside the database", err}
	}

	err = handler.AuthorizationSetService.DeleteAuthorizationSet(portainer.AuthorizationSetID(authorizationSetID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to delete the authorization set from the database", err}
	}

	return response.Empty(w)
}
