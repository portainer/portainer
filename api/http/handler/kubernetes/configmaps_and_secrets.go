package kubernetes

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

func (handler *Handler) getKubernetesConfigMaps(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	cli, ok := handler.kubernetesClientFactory.GetProxyKubeClient(
		strconv.Itoa(endpointID), r.Header.Get("Authorization"),
	)
	if !ok {
		return httperror.InternalServerError(
			"Failed to lookup KubeClient",
			nil,
		)
	}

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}

	configmaps, err := cli.GetConfigMapsAndSecrets(namespace)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to retrieve configmaps and secrets",
			err,
		)
	}

	return response.JSON(w, configmaps)
}
