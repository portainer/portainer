package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

// @id GetKubernetesConfigMaps
// @summary Fetches a list of config maps for a given namespace
// @description Fetches a list of config maps for a given namespace
// classes from the kubernetes api
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized"
// @failure 403 "Permission denied"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace}/configmaps [get]
func (handler *Handler) getKubernetesConfigMaps(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli := handler.KubernetesClient

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid namespace identifier route variable",
			Err:        err,
		}
	}

	configmaps, err := cli.GetConfigMapsAndSecrets(namespace)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve nodes limits",
			Err:        err,
		}
	}

	return response.JSON(w, configmaps)
}
