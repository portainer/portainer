package deploymentkeys

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// GET request on /api/deployment_keys/:id
func (handler *Handler) deploymentkeyInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	deploymentkeyID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid deploymentkey identifier route variable", err}
	}

	deploymentkey, err := handler.DeploymentKeyService.DeploymentKey(portainer.DeploymentKeyID(deploymentkeyID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a deployment key with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a deployment key with the specified identifier inside the database", err}
	}

	hideFields(deploymentkey)

	return response.JSON(w, deploymentkey)
}
