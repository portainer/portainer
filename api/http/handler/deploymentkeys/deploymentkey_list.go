package deploymentkeys

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// GET request on /api/deployment_keys
func (handler *Handler) deploymentkeyList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	deploymentkeys, err := handler.DeploymentKeyService.DeploymentKeys()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve deploymentkeys from the database", err}
	}

	return response.JSON(w, deploymentkeys)
}
