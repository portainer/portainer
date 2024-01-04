package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
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
// @success 200 {array} []kubernetes.K8sConfigMapOrSecret "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @deprecated
// @router /kubernetes/{id}/namespaces/{namespace}/configuration [get]
func (handler *Handler) getKubernetesConfigMapsAndSecrets(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("Invalid namespace identifier route variable", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	configmaps, err := cli.GetConfigMapsAndSecrets(namespace)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve configmaps and secrets", err)
	}

	return response.JSON(w, configmaps)
}
