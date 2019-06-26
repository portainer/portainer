package deploymentkeys

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// DELETE request on /api/webhook/:serviceID
func (handler *Handler) deploymentkeyDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid deployment key id", err}
	}

	err = handler.DeploymentKeyService.DeleteDeploymentKey(portainer.DeploymentKeyID(id))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the deployment key from the database", err}
	}

	return response.Empty(w)
}
