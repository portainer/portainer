package scenes

import (
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"net/http"
)

// @id sceneList
// @summary List Scenes
// @description List all scenes
// @description Will return all scenes
// @description will only return Scenes.
// @description **Access policy**: Scened
// @tags Scenes
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {array} portainer.Scenes "Success"
// @failure 500 "Server error"
// @router /scenes [get]
func (handler *Handler) sceneList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}
	if !securityContext.IsAdmin {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to list scenes, use /scenes/:sceneId/scenes route instead", httperrors.ErrResourceAccessDenied}
	}

	scenes, err := handler.DataStore.Scene().Scenes()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve scenes from the database", err}
	}

	return response.JSON(w, scenes)
}
