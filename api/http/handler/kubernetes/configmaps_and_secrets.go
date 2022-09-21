package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

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
