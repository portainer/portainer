package auth

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/security"
)

// POST request on /logout
func (handler *Handler) logout(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user details from authentication token", err}
	}

	handler.KubernetesTokenCacheManager.RemoveUserFromCache(int(tokenData.ID))

	return response.Empty(w)
}
