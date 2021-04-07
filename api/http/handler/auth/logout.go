package auth

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/security"
)

// POST request on /logout
func (handler *Handler) logout(w http.ResponseWriter, r *http.Request) (*authMiddlewareResponse, *httperror.HandlerError) {
	tokenData, err := security.RetrieveTokenData(r)
	resp := &authMiddlewareResponse{
		Username: tokenData.Username,
	}

	if err != nil {
		return resp, &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve user details from authentication token",
			Err:        err,
		}

	}

	handler.KubernetesTokenCacheManager.RemoveUserFromCache(int(tokenData.ID))

	return resp, response.Empty(w)

}
