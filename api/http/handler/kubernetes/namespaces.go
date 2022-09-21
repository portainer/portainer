package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/database/models"
)

func (handler *Handler) getKubernetesNamespaces(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli := handler.KubernetesClient

	namespaces, err := cli.GetNamespaces()
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve nodes limits",
			Err:        err,
		}
	}

	return response.JSON(w, namespaces)
}

func (handler *Handler) createKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli := handler.KubernetesClient

	var payload models.K8sNamespaceInfo
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid request payload",
			Err:        err,
		}
	}

	err = cli.CreateNamespace(payload)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve nodes limits",
			Err:        err,
		}
	}
	return nil
}

func (handler *Handler) deleteKubernetesNamespaces(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli := handler.KubernetesClient

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid namespace identifier route variable",
			Err:        err,
		}
	}

	err = cli.DeleteNamespace(namespace)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve nodes limits",
			Err:        err,
		}
	}

	return nil
}

func (handler *Handler) updateKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli := handler.KubernetesClient

	var payload models.K8sNamespaceInfo
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid request payload",
			Err:        err,
		}
	}

	err = cli.UpdateNamespace(payload)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve nodes limits",
			Err:        err,
		}
	}
	return nil
}
