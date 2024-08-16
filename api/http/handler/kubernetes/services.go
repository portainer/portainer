package kubernetes

import (
	"net/http"

	"github.com/portainer/portainer/api/http/middlewares"
	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GetKubernetesEnvironmentServices
// @summary Get a list of kubernetes services within the given environment
// @description Get a list of kubernetes services within the given environment
// @description **Access policy**: Authenticated users only.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param withApplications query boolean false "Lookup applications associated with each service"
// @success 200 {array} models.K8sServiceInfo "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/services [get]
func (handler *Handler) GetKubernetesClusterServices(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	services, err := handler.getKubernetesClusterServices(r)
	if err != nil {
		return err
	}

	return response.JSON(w, services)
}

// @id getKubernetesClusterServicesCount
// @summary Get the number of kubernetes services within the given environment
// @description Get the number of kubernetes services within the given environment
// @description **Access policy**: Authenticated users only.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @success 200 {object} models.K8sServicesCount "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/services/count [get]
func (handler *Handler) getKubernetesClusterServicesCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	services, err := handler.getKubernetesClusterServices(r)
	if err != nil {
		return err
	}

	return response.JSON(w, len(services))
}

func (handler *Handler) getKubernetesClusterServices(r *http.Request) ([]models.K8sServiceInfo, *httperror.HandlerError) {
	withApplications, err := request.RetrieveBooleanQueryParameter(r, "withApplications", false)
	if err != nil {
		return nil, httperror.BadRequest("an error occurred during the GetKubernetesEnvironmentServices operation, unable to retrieve withApplications query parameter. Error: ", err)
	}

	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return nil, httperror.NotFound("an error occurred during the GetKubernetesEnvironmentServices operation, unable to fetch endpoint. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return nil, httpErr
	}

	pcli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return nil, httperror.InternalServerError("an error occurred during the GetKubernetesEnvironmentServices operation, unable to get privileged kube client for combining services with applications. Error: ", err)
	}
	pcli.IsKubeAdmin = cli.IsKubeAdmin
	pcli.NonAdminNamespaces = cli.NonAdminNamespaces

	services, err := pcli.GetServices("")
	if err != nil {
		return nil, httperror.InternalServerError("an error occurred during the GetKubernetesEnvironmentServices operation, unable to retrieve services from the Kubernetes for a cluster level user. Error: ", err)
	}

	if withApplications {
		servicesWithApplications, err := pcli.CombineServicesWithApplications(&services)
		if err != nil {
			return nil, httperror.InternalServerError("an error occurred during the GetKubernetesEnvironmentServices operation, unable to combine services with applications. Error: ", err)
		}

		return servicesWithApplications, nil
	}

	return services, nil
}

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
// @param withApplications query boolean false "Lookup applications associated with each service"
// @success 200 {array} models.K8sServiceInfo "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace}/services [get]
func (handler *Handler) getKubernetesServices(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesServices operation, unable to retrieve namespace identifier route variable. Error: ", err)
	}

	cli, httpError := handler.getProxyKubeClient(r)
	if httpError != nil {
		return httpError
	}

	services, err := cli.GetServices(namespace)
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesServices operation, unable to retrieve services from the Kubernetes for a namespace level user. Error: ", err)
	}

	_, err = request.RetrieveBooleanQueryParameter(r, "withApplications", true)
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesServices operation, unable to retrieve withApplications query parameter. Error: ", err)
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

	cli, httpError := handler.getProxyKubeClient(r)
	if httpError != nil {
		return httpError
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

	cli, httpError := handler.getProxyKubeClient(r)
	if httpError != nil {
		return httpError
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

	cli, httpError := handler.getProxyKubeClient(r)
	if httpError != nil {
		return httpError
	}

	err = cli.UpdateService(namespace, payload)
	if err != nil {
		return httperror.InternalServerError("Unable to update service", err)
	}

	return nil
}
