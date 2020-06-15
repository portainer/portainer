package users

import (
	"errors"
	"net/http"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	portainererrors "github.com/portainer/portainer/api/internal/errors"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

// GET request on /api/users/:id
func (handler *Handler) userInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid user identifier route variable", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if !securityContext.IsAdmin && securityContext.UserID != portainer.UserID(userID) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied inspect user", errors.New(portainererrors.ErrResourceAccessDenied)}
	}

	user, err := handler.DataStore.User().User(portainer.UserID(userID))
	if err.Error() == portainererrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a user with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a user with the specified identifier inside the database", err}
	}

	hideFields(user)
	return response.JSON(w, user)
}
