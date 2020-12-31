package auth

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/security"
)

// logout godoc
// @id logout
// @summary Logout
// @tags auth
// @accept json
// @produce json
// @success 204
// @router /auth/logout [post]
func (handler *Handler) logout(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user details from logout token", err}
	}

	handler.KubernetesTokenCacheManager.RemoveUserFromCache(int(tokenData.ID))

	return response.Empty(w)
}
