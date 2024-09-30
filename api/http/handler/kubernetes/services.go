package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// @id GetKubernetesServices
// @summary Get a list of services
// @description Get a list of services that the user has access to.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param withApplications query boolean false "Lookup applications associated with each service"
// @success 200 {array} models.K8sServiceInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve all services."
// @router /kubernetes/{id}/services [get]
func (handler *Handler) GetAllKubernetesServices(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	services, err := handler.getAllKubernetesServices(r)
	if err != nil {
		return err
	}

	return response.JSON(w, services)
}

// @id GetAllKubernetesServicesCount
// @summary Get services count
// @description Get the count of services that the user has access to.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {integer} integer "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the total count of all services."
// @router /kubernetes/{id}/services/count [get]
func (handler *Handler) getAllKubernetesServicesCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	services, err := handler.getAllKubernetesServices(r)
	if err != nil {
		return err
	}

	return response.JSON(w, len(services))
}

func (handler *Handler) getAllKubernetesServices(r *http.Request) ([]models.K8sServiceInfo, *httperror.HandlerError) {
	withApplications, err := request.RetrieveBooleanQueryParameter(r, "withApplications", true)
	if err != nil {
		log.Error().Err(err).Str("context", "GetAllKubernetesServices").Msg("Unable to retrieve withApplications identifier")
		return nil, httperror.BadRequest("unable to retrieve withApplications query parameter. Error: ", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetAllKubernetesServices").Msg("Unable to get a Kubernetes client for the user")
		return nil, httperror.InternalServerError("unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	services, err := cli.GetServices("")
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "GetAllKubernetesServices").Msg("Unauthorized access to the Kubernetes API")
			return nil, httperror.Forbidden("unauthorized access to the Kubernetes API. Error: ", err)
		}

		log.Error().Err(err).Str("context", "GetAllKubernetesServices").Msg("Unable to retrieve services from the Kubernetes for a cluster level user")
		return nil, httperror.InternalServerError("unable to retrieve services from the Kubernetes for a cluster level user. Error: ", err)
	}

	if withApplications && len(services) > 0 {
		servicesWithApplications, err := cli.CombineServicesWithApplications(services)
		if err != nil {
			log.Error().Err(err).Str("context", "GetAllKubernetesServices").Msg("Unable to combine services with applications")
			return nil, httperror.InternalServerError("unable to combine services with applications. Error: ", err)
		}

		return servicesWithApplications, nil
	}

	return services, nil
}

// @id GetKubernetesServicesByNamespace
// @summary Get a list of services for a given namespace
// @description Get a list of services for a given namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @success 200 {array} models.K8sServiceInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve all services for a namespace."
// @router /kubernetes/{id}/namespaces/{namespace}/services [get]
func (handler *Handler) getKubernetesServicesByNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesServicesByNamespace").Str("namespace", namespace).Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("unable to retrieve namespace identifier route variable. Error: ", err)
	}

	cli, httpError := handler.getProxyKubeClient(r)
	if httpError != nil {
		return httpError
	}

	services, err := cli.GetServices(namespace)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "GetKubernetesServicesByNamespace").Str("namespace", namespace).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("unauthorized access to the Kubernetes API. Error: ", err)
		}

		log.Error().Err(err).Str("context", "GetKubernetesServicesByNamespace").Str("namespace", namespace).Msg("Unable to retrieve services from the Kubernetes for a namespace level user")
		return httperror.InternalServerError("unable to retrieve services from the Kubernetes for a namespace level user. Error: ", err)
	}

	return response.JSON(w, services)
}

// @id CreateKubernetesService
// @summary Create a service
// @description Create a service within a given namespace
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @param body body models.K8sServiceInfo true "Service definition"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to create a service."
// @router /kubernetes/{id}/namespaces/{namespace}/services [post]
func (handler *Handler) createKubernetesService(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "CreateKubernetesService").Str("namespace", namespace).Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("unable to retrieve namespace identifier route variable. Error: ", err)
	}

	var payload models.K8sServiceInfo
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		log.Error().Err(err).Str("context", "CreateKubernetesService").Str("namespace", namespace).Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("unable to decode and validate the request payload. Error: ", err)
	}

	serviceName := payload.Name
	cli, httpError := handler.getProxyKubeClient(r)
	if httpError != nil {
		log.Error().Err(httpError).Str("context", "CreateKubernetesService").Str("namespace", namespace).Str("service", serviceName).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("unable to get a Kubernetes client for the user. Error: ", httpError)
	}

	err = cli.CreateService(namespace, payload)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "CreateKubernetesService").Str("namespace", namespace).Str("service", serviceName).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("unauthorized access to the Kubernetes API. Error: ", err)
		}

		if k8serrors.IsAlreadyExists(err) {
			log.Error().Err(err).Str("context", "CreateKubernetesService").Str("namespace", namespace).Str("service", serviceName).Msg("A service with the same name already exists in the namespace")
			return httperror.Conflict("a service with the same name already exists in the namespace. Error: ", err)
		}

		log.Error().Err(err).Str("context", "CreateKubernetesService").Str("namespace", namespace).Str("service", serviceName).Msg("Unable to create a service")
		return httperror.InternalServerError("unable to create a service. Error: ", err)
	}

	return response.Empty(w)
}

// @id DeleteKubernetesServices
// @summary Delete services
// @description Delete the provided list of services.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param body body models.K8sServiceDeleteRequests true "A map where the key is the namespace and the value is an array of services to delete"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find a specific service."
// @failure 500 "Server error occurred while attempting to delete services."
// @router /kubernetes/{id}/services/delete [post]
func (handler *Handler) deleteKubernetesServices(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := models.K8sServiceDeleteRequests{}
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		log.Error().Err(err).Str("context", "DeleteKubernetesServices").Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("unable to decode and validate the request payload. Error: ", err)
	}

	cli, httpError := handler.getProxyKubeClient(r)
	if httpError != nil {
		return httpError
	}

	err = cli.DeleteServices(payload)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "DeleteKubernetesServices").Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("unauthorized access to the Kubernetes API. Error: ", err)
		}

		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "DeleteKubernetesServices").Msg("Unable to find the services to delete")
			return httperror.NotFound("unable to find the services to delete. Error: ", err)
		}

		log.Error().Err(err).Str("context", "DeleteKubernetesServices").Msg("Unable to delete services")
		return httperror.InternalServerError("unable to delete services. Error: ", err)
	}

	return response.Empty(w)
}

// @id UpdateKubernetesService
// @summary Update a service
// @description Update a service within a given namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @param body body models.K8sServiceInfo true "Service definition"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find the service to update."
// @failure 500 "Server error occurred while attempting to update a service."
// @router /kubernetes/{id}/namespaces/{namespace}/services [put]
func (handler *Handler) updateKubernetesService(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "UpdateKubernetesService").Str("namespace", namespace).Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("unable to retrieve namespace identifier route variable. Error: ", err)
	}

	var payload models.K8sServiceInfo
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		log.Error().Err(err).Str("context", "UpdateKubernetesService").Str("namespace", namespace).Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("unable to decode and validate the request payload. Error: ", err)
	}

	serviceName := payload.Name
	cli, httpError := handler.getProxyKubeClient(r)
	if httpError != nil {
		log.Error().Err(httpError).Str("context", "UpdateKubernetesService").Str("namespace", namespace).Str("service", serviceName).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("unable to get a Kubernetes client for the user. Error: ", httpError)
	}

	err = cli.UpdateService(namespace, payload)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "UpdateKubernetesService").Str("namespace", namespace).Str("service", serviceName).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("unauthorized access to the Kubernetes API. Error: ", err)
		}

		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "UpdateKubernetesService").Str("namespace", namespace).Str("service", serviceName).Msg("Unable to find the service to update")
			return httperror.NotFound("unable to find the service to update. Error: ", err)
		}

		log.Error().Err(err).Str("context", "UpdateKubernetesService").Str("namespace", namespace).Str("service", serviceName).Msg("Unable to update a service")
		return httperror.InternalServerError("unable to update a service. Error: ", err)
	}

	return nil
}
