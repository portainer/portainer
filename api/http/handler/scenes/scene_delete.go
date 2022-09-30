package scenes

import (
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"net/http"
)

// @id SceneDelete
// @summary Remove a Scene
// @description Remove a Scene
// @description **Access policy**: restricted
// @tags Scene
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Scene identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 404 "Scene not found"
// @failure 500 "Server error"
// @router /scenes/{id} [delete]
func (handler *Handler) sceneDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}
	if !securityContext.IsAdmin {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to delete scenes", httperrors.ErrResourceAccessDenied}
	}

	sceneID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid scenes identifier route variable", err}
	}

	_, err = handler.DataStore.Scene().Scene(sceneID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a scenes with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a scenes with the specified identifier inside the database", err}
	}

	err = handler.DataStore.Scene().DeleteScene(sceneID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the scenes from the database", err}
	}

	return response.Empty(w)
}
