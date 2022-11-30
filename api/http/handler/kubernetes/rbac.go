package kubernetes

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

func (handler *Handler) getIsRBACEnabled(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	// with the endpoint id and user auth, create a kube client instance
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	cli, ok := handler.KubernetesClientFactory.GetProxyKubeClient(
		strconv.Itoa(endpointID), r.Header.Get("Authorization"),
	)
	if !ok {
		return httperror.InternalServerError(
			"Failed to lookup KubeClient",
			nil,
		)
	}

	// with the kube client instance, check if RBAC is enabled
	isRBACEnabled, err := cli.IsRBACEnabled()
	if err != nil {
		return httperror.InternalServerError(
			"Failed to check RBAC status",
			err,
		)
	}

	return response.JSON(w, isRBACEnabled)
}
