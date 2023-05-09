package kubernetes

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

// @id getKubernetesConfigMapsAndSecrets
// @summary Get ConfigMaps and Secrets
// @description Get all ConfigMaps and Secrets for a given namespace
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Namespace name"
// @success 200 {array} kubernetes.K8sConfigMapOrSecret "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace}/configuration [get]
func (handler *Handler) getKubernetesConfigMapsAndSecrets(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
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
