package auth

import (
	"net/http"

	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/logoutcontext"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id Logout
// @summary Logout
// @description **Access policy**: public
// @security ApiKeyAuth
// @security jwt
// @tags auth
// @success 204 "Success"
// @failure 500 "Server error"
// @router /auth/logout [post]
func (handler *Handler) logout(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	tokenData, _ := handler.bouncer.CookieAuthLookup(r)

	if tokenData != nil {
		handler.KubernetesTokenCacheManager.RemoveUserFromCache(tokenData.ID)
		logoutcontext.Cancel(tokenData.Token)
	}

	security.RemoveAuthCookie(w)

	handler.bouncer.RevokeJWT(tokenData.Token)

	return response.Empty(w)
}
