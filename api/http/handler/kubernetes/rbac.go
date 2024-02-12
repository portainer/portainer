package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id IsRBACEnabled
// @summary Check if RBAC is enabled
// @description Check if RBAC is enabled in the current Kubernetes cluster.
// @description **Access policy**: administrator
// @tags rbac_enabled
// @security ApiKeyAuth
// @security jwt
// @produce text/plain
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 "Success"
// @failure 500 "Server error"
// @router /kubernetes/{id}/rbac_enabled [get]
func (handler *Handler) isRBACEnabled(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	isRBACEnabled, err := cli.IsRBACEnabled()
	if err != nil {
		return httperror.InternalServerError("Failed to check RBAC status", err)
	}

	return response.JSON(w, isRBACEnabled)
}
