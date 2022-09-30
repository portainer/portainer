package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer-ee/api/database/models"
)

// @id GetKubernetesServices
// @summary Fetches a list of services in a namespace
// @description Fetches a list of services in a namespace
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
// @router /kubernetes/{id}/namespaces/{namespace}/services [get]
func (handler *Handler) getKubernetesServices(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid namespace identifier route variable",
			Err:        err,
		}
	}

	cli := handler.KubernetesClient
	services, err := cli.GetServices(namespace)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve services",
			Err:        err,
		}
	}

	return response.JSON(w, services)
}

// @id CreateKubernetesService
// @summary Creates an service in a namespace
// @description Creates an service in a namespace
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body models.K8sServiceInfo true "service to create"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized"
// @failure 403 "Permission denied"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace}/services [post]
func (handler *Handler) createKubernetesService(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid namespace identifier route variable",
			Err:        err,
		}
	}

	var payload models.K8sServiceInfo
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid request payload",
			Err:        err,
		}
	}

	cli := handler.KubernetesClient
	err = cli.CreateService(namespace, payload)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve nodes limits",
			Err:        err,
		}
	}
	return nil
}

// @id DeleteKubernetesServices
// @summary Deletes a service in a namespace
// @description Deletes a service in a namespace
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body models.K8sServiceDeleteRequests true "service to delete"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized"
// @failure 403 "Permission denied"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace}/services/delete [post]
func (handler *Handler) deleteKubernetesServices(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli := handler.KubernetesClient

	var payload models.K8sServiceDeleteRequests
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid request payload",
			Err:        err,
		}
	}

	err = cli.DeleteServices(payload)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve nodes limits",
			Err:        err,
		}
	}
	return nil
}

// @id UpdateKubernetesService
// @summary Updates an service in a namespace
// @description Updates an service in a namespace
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body models.K8sServiceInfo true "service to update"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized"
// @failure 403 "Permission denied"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace}/services [put]
func (handler *Handler) updateKubernetesService(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid namespace identifier route variable",
			Err:        err,
		}
	}

	var payload models.K8sServiceInfo
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid request payload",
			Err:        err,
		}
	}

	cli := handler.KubernetesClient
	err = cli.UpdateService(namespace, payload)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve nodes limits",
			Err:        err,
		}
	}
	return nil
}
