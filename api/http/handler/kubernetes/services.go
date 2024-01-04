package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id getKubernetesServices
// @summary Get a list of kubernetes services for a given namespace
// @description Get a list of kubernetes services for a given namespace
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Namespace name"
// @param lookupapplications query boolean false "Lookup applications associated with each service"
// @success 200 {array} models.K8sServiceInfo "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace}/services [get]
func (handler *Handler) getKubernetesServices(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("Invalid namespace identifier route variable", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	lookup, err := request.RetrieveBooleanQueryParameter(r, "lookupapplications", true)
	if err != nil {
		return httperror.BadRequest("Invalid lookupapplications query parameter", err)
	}

	services, err := cli.GetServices(namespace, lookup)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve services", err)
	}

	return response.JSON(w, services)
}

// @id createKubernetesService
// @summary Create a kubernetes service
// @description Create a kubernetes service within a given namespace
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Namespace name"
// @param body body models.K8sServiceInfo true "Service definition"
// @success 200  "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace}/services [post]
func (handler *Handler) createKubernetesService(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("Invalid namespace identifier route variable", err)
	}

	var payload models.K8sServiceInfo
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.CreateService(namespace, payload)
	if err != nil {
		return httperror.InternalServerError("Unable to create sercice", err)
	}

	return nil
}

// @id deleteKubernetesServices
// @summary Delete kubernetes services
// @description Delete the provided list of kubernetes services
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param body body models.K8sServiceDeleteRequests true "A map where the key is the namespace and the value is an array of services to delete"
// @success 200  "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/services/delete [post]
func (handler *Handler) deleteKubernetesServices(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload models.K8sServiceDeleteRequests
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest(
			"Invalid request payload",
			err,
		)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.DeleteServices(payload)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to delete service",
			err,
		)
	}
	return nil
}

// @id updateKubernetesService
// @summary Update a kubernetes service
// @description Update a kubernetes service within a given namespace
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Namespace name"
// @param body body models.K8sServiceInfo true "Service definition"
// @success 200  "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace}/services [put]
func (handler *Handler) updateKubernetesService(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("Invalid namespace identifier route variable", err)
	}

	var payload models.K8sServiceInfo
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.UpdateService(namespace, payload)
	if err != nil {
		return httperror.InternalServerError("Unable to update service", err)
	}

	return nil
}
