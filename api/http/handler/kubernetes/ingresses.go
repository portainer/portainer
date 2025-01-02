package kubernetes

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/middlewares"
	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// @id GetAllKubernetesIngressControllers
// @summary Get a list of ingress controllers
// @description Get a list of ingress controllers for the given environment. If the allowedOnly query parameter is set, only ingress controllers that are allowed by the environment's ingress configuration will be returned.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param allowedOnly query boolean false "Only return allowed ingress controllers"
// @success 200 {object} models.K8sIngressControllers "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve ingress controllers"
// @router /kubernetes/{id}/ingresscontrollers [get]
func (handler *Handler) getAllKubernetesIngressControllers(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		log.Error().Err(err).Str("context", "getAllKubernetesIngressControllers").Msg("Invalid environment identifier route variable")
		return httperror.BadRequest("Invalid environment identifier route variable", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err != nil {
		if handler.DataStore.IsErrObjectNotFound(err) {
			log.Error().Err(err).Str("context", "getAllKubernetesIngressControllers").Msg("Unable to find an environment with the specified identifier inside the database")
			return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
		}

		log.Error().Err(err).Str("context", "getAllKubernetesIngressControllers").Msg("Unable to find an environment with the specified identifier inside the database")
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	allowedOnly, err := request.RetrieveBooleanQueryParameter(r, "allowedOnly", true)
	if err != nil {
		log.Error().Err(err).Str("context", "getAllKubernetesIngressControllers").Msg("Unable to retrieve allowedOnly query parameter")
		return httperror.BadRequest("Unable to retrieve allowedOnly query parameter", err)
	}

	cli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		log.Error().Err(err).Str("context", "getAllKubernetesIngressControllers").Msg("Unable to get privileged kube client")
		return httperror.InternalServerError("Unable to get privileged kube client", err)
	}

	controllers, err := cli.GetIngressControllers()
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getAllKubernetesIngressControllers").Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		log.Error().Err(err).Str("context", "getAllKubernetesIngressControllers").Msg("Unable to retrieve ingress controllers from the Kubernetes")
		return httperror.InternalServerError("Unable to retrieve ingress controllers from the Kubernetes", err)
	}

	// Add none controller if "AllowNone" is set for endpoint.
	if endpoint.Kubernetes.Configuration.AllowNoneIngressClass {
		controllers = append(controllers, models.K8sIngressController{
			Name:      "none",
			ClassName: "none",
			Type:      "custom",
		})
	}
	existingClasses := endpoint.Kubernetes.Configuration.IngressClasses
	updatedClasses := []portainer.KubernetesIngressClassConfig{}
	for i := range controllers {
		controllers[i].Availability = true
		if controllers[i].ClassName != "none" {
			controllers[i].New = true
		}

		updatedClass := portainer.KubernetesIngressClassConfig{
			Name: controllers[i].ClassName,
			Type: controllers[i].Type,
		}

		// Check if the controller is already known.
		for _, existingClass := range existingClasses {
			if controllers[i].ClassName != existingClass.Name {
				continue
			}
			controllers[i].New = false
			controllers[i].Availability = !existingClass.GloballyBlocked
			updatedClass.GloballyBlocked = existingClass.GloballyBlocked
			updatedClass.BlockedNamespaces = existingClass.BlockedNamespaces
		}
		updatedClasses = append(updatedClasses, updatedClass)
	}

	endpoint.Kubernetes.Configuration.IngressClasses = updatedClasses
	err = handler.DataStore.Endpoint().UpdateEndpoint(
		portainer.EndpointID(endpointID),
		endpoint,
	)
	if err != nil {
		log.Error().Err(err).Str("context", "getAllKubernetesIngressControllers").Msg("Unable to store found IngressClasses inside the database")
		return httperror.InternalServerError("Unable to store found IngressClasses inside the database", err)
	}

	// If the allowedOnly query parameter was set. We need to prune out
	// disallowed controllers from the response.
	if allowedOnly {
		allowedControllers := models.K8sIngressControllers{}
		for _, controller := range controllers {
			if controller.Availability {
				allowedControllers = append(allowedControllers, controller)
			}
		}
		controllers = allowedControllers
	}
	return response.JSON(w, controllers)
}

// @id GetKubernetesIngressControllersByNamespace
// @summary Get a list ingress controllers by namespace
// @description Get a list of ingress controllers for the given environment in the provided namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace"
// @success 200 {object} models.K8sIngressControllers "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or a namespace with the specified name."
// @failure 500 "Server error occurred while attempting to retrieve ingress controllers by a namespace"
// @router /kubernetes/{id}/namespaces/{namespace}/ingresscontrollers [get]
func (handler *Handler) getKubernetesIngressControllersByNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesIngressControllersByNamespace").Msg("Unable to retrieve environment identifier from request")
		return httperror.BadRequest("Unable to retrieve environment identifier from request", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err != nil {
		if handler.DataStore.IsErrObjectNotFound(err) {
			log.Error().Err(err).Str("context", "getKubernetesIngressControllersByNamespace").Msg("Unable to find an environment with the specified identifier inside the database")
			return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesIngressControllersByNamespace").Msg("Unable to find an environment with the specified identifier inside the database")
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	cli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		log.Error().Err(err).Str("context", "getAllKubernetesIngressControllers").Msg("Unable to create Kubernetes client")
		return httperror.InternalServerError("Unable to create Kubernetes client", err)
	}

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesIngressControllersByNamespace").Msg("Unable to retrieve namespace from request")
		return httperror.BadRequest("Unable to retrieve namespace from request", err)
	}

	currentControllers, err := cli.GetIngressControllers()
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesIngressControllersByNamespace").Str("namespace", namespace).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesIngressControllersByNamespace").Str("namespace", namespace).Msg("Unable to retrieve ingress controllers from the Kubernetes")
		return httperror.InternalServerError("Unable to retrieve ingress controllers from the Kubernetes", err)
	}
	// Add none controller if "AllowNone" is set for endpoint.
	if endpoint.Kubernetes.Configuration.AllowNoneIngressClass {
		currentControllers = append(currentControllers, models.K8sIngressController{
			Name:      "none",
			ClassName: "none",
			Type:      "custom",
		})
	}

	kubernetesConfig := endpoint.Kubernetes.Configuration
	existingClasses := kubernetesConfig.IngressClasses
	ingressAvailabilityPerNamespace := kubernetesConfig.IngressAvailabilityPerNamespace
	updatedClasses := []portainer.KubernetesIngressClassConfig{}
	controllers := models.K8sIngressControllers{}

	for i := range currentControllers {
		globallyblocked := false
		currentControllers[i].Availability = true
		if currentControllers[i].ClassName != "none" {
			currentControllers[i].New = true
		}

		updatedClass := portainer.KubernetesIngressClassConfig{
			Name: currentControllers[i].ClassName,
			Type: currentControllers[i].Type,
		}

		// Check if the controller is blocked globally or in the current
		// namespace.
		for _, existingClass := range existingClasses {
			if currentControllers[i].ClassName != existingClass.Name {
				continue
			}
			currentControllers[i].New = false
			updatedClass.GloballyBlocked = existingClass.GloballyBlocked
			updatedClass.BlockedNamespaces = existingClass.BlockedNamespaces

			globallyblocked = existingClass.GloballyBlocked

			// Check if the current namespace is blocked if ingressAvailabilityPerNamespace is set to true
			if ingressAvailabilityPerNamespace {
				for _, ns := range existingClass.BlockedNamespaces {
					if namespace == ns {
						currentControllers[i].Availability = false
					}
				}
			}
		}
		if !globallyblocked {
			controllers = append(controllers, currentControllers[i])
		}
		updatedClasses = append(updatedClasses, updatedClass)
	}

	// Update the database to match the list of found controllers.
	// This includes pruning out controllers which no longer exist.
	endpoint.Kubernetes.Configuration.IngressClasses = updatedClasses
	err = handler.DataStore.Endpoint().UpdateEndpoint(portainer.EndpointID(endpointID), endpoint)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesIngressControllersByNamespace").Msg("Unable to store found IngressClasses inside the database")
		return httperror.InternalServerError("Unable to store found IngressClasses inside the database", err)
	}
	return response.JSON(w, controllers)
}

// @id UpdateKubernetesIngressControllers
// @summary Update (block/unblock) ingress controllers
// @description Update (block/unblock) ingress controllers for the provided environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param body body models.K8sIngressControllers true "Ingress controllers"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find the ingress controllers to update."
// @failure 500 "Server error occurred while attempting to update ingress controllers."
// @router /kubernetes/{id}/ingresscontrollers [put]
func (handler *Handler) updateKubernetesIngressControllers(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesIngressControllers").Msg("Unable to retrieve environment identifier from request")
		return httperror.BadRequest("Unable to retrieve environment identifier from request", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err != nil {
		if handler.DataStore.IsErrObjectNotFound(err) {
			log.Error().Err(err).Str("context", "updateKubernetesIngressControllers").Msg("Unable to find an environment with the specified identifier inside the database")
			return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
		}

		log.Error().Err(err).Str("context", "updateKubernetesIngressControllers").Msg("Unable to find an environment with the specified identifier inside the database")
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	payload := models.K8sIngressControllers{}
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesIngressControllers").Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("Unable to decode and validate the request payload", err)
	}

	cli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesIngressControllers").Msg("Unable to get privileged kube client")
		return httperror.InternalServerError("Unable to get privileged kube client", err)
	}

	existingClasses := endpoint.Kubernetes.Configuration.IngressClasses
	controllers, err := cli.GetIngressControllers()
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "updateKubernetesIngressControllers").Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "updateKubernetesIngressControllers").Msg("Unable to retrieve ingress controllers from the Kubernetes")
			return httperror.NotFound("Unable to retrieve ingress controllers from the Kubernetes", err)
		}

		log.Error().Err(err).Str("context", "updateKubernetesIngressControllers").Msg("Unable to retrieve ingress controllers from the Kubernetes")
		return httperror.InternalServerError("Unable to retrieve ingress controllers from the Kubernetes", err)
	}

	// Add none controller if "AllowNone" is set for endpoint.
	if endpoint.Kubernetes.Configuration.AllowNoneIngressClass {
		controllers = append(controllers, models.K8sIngressController{
			Name:      "none",
			ClassName: "none",
			Type:      "custom",
		})
	}

	updatedClasses := []portainer.KubernetesIngressClassConfig{}
	for i := range controllers {
		controllers[i].Availability = true
		controllers[i].New = true

		updatedClass := portainer.KubernetesIngressClassConfig{
			Name: controllers[i].ClassName,
			Type: controllers[i].Type,
		}

		// Check if the controller is already known.
		for _, existingClass := range existingClasses {
			if controllers[i].ClassName != existingClass.Name {
				continue
			}
			controllers[i].New = false
			controllers[i].Availability = !existingClass.GloballyBlocked
			updatedClass.GloballyBlocked = existingClass.GloballyBlocked
			updatedClass.BlockedNamespaces = existingClass.BlockedNamespaces
		}
		updatedClasses = append(updatedClasses, updatedClass)
	}

	for _, p := range payload {
		for i := range controllers {
			// Now set new payload data
			if updatedClasses[i].Name == p.ClassName {
				updatedClasses[i].GloballyBlocked = !p.Availability
			}
		}
	}

	endpoint.Kubernetes.Configuration.IngressClasses = updatedClasses
	err = handler.DataStore.Endpoint().UpdateEndpoint(
		portainer.EndpointID(endpointID),
		endpoint,
	)
	if err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesIngressControllers").Msg("Unable to store found IngressClasses inside the database")
		return httperror.InternalServerError("Unable to store found IngressClasses inside the database", err)
	}

	return response.Empty(w)
}

// @id UpdateKubernetesIngressControllersByNamespace
// @summary Update (block/unblock) ingress controllers by namespace
// @description Update (block/unblock) ingress controllers by namespace for the provided environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @param body body models.K8sIngressControllers true "Ingress controllers"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to update ingress controllers by namespace."
// @router /kubernetes/{id}/namespaces/{namespace}/ingresscontrollers [put]
func (handler *Handler) updateKubernetesIngressControllersByNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesIngressControllersByNamespace").Msg("Unable to fetch endpoint")
		return httperror.NotFound("Unable to fetch endpoint", err)
	}

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesIngressControllersByNamespace").Msg("Unable to retrieve namespace from request")
		return httperror.BadRequest("Unable to retrieve namespace from request", err)
	}

	payload := models.K8sIngressControllers{}
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesIngressControllersByNamespace").Str("namespace", namespace).Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("Unable to decode and validate the request payload", err)
	}

	existingClasses := endpoint.Kubernetes.Configuration.IngressClasses
	updatedClasses := []portainer.KubernetesIngressClassConfig{}
PayloadLoop:
	for _, p := range payload {
		for _, existingClass := range existingClasses {
			if p.ClassName != existingClass.Name {
				continue
			}
			updatedClass := portainer.KubernetesIngressClassConfig{
				Name:            existingClass.Name,
				Type:            existingClass.Type,
				GloballyBlocked: existingClass.GloballyBlocked,
			}

			// Handle "allow"
			if p.Availability {
				// remove the namespace from the list of blocked namespaces
				// in the existingClass.
				for _, blockedNS := range existingClass.BlockedNamespaces {
					if blockedNS != namespace {
						updatedClass.BlockedNamespaces = append(updatedClass.BlockedNamespaces, blockedNS)
					}
				}

				updatedClasses = append(updatedClasses, updatedClass)
				continue PayloadLoop
			}

			// Handle "disallow"
			// If it's meant to be blocked we need to add the current
			// namespace. First, check if it's already in the
			// BlockedNamespaces and if not we append it.
			updatedClass.BlockedNamespaces = existingClass.BlockedNamespaces
			for _, ns := range updatedClass.BlockedNamespaces {
				if namespace == ns {
					updatedClasses = append(updatedClasses, updatedClass)
					continue PayloadLoop
				}
			}
			updatedClass.BlockedNamespaces = append(updatedClass.BlockedNamespaces, namespace)
			updatedClasses = append(updatedClasses, updatedClass)
		}
	}

	// At this point it's possible we had an existing class which was globally
	// blocked and thus not included in the payload. As a result it is not yet
	// part of updatedClasses, but we MUST include it or we would remove the
	// global block.
	for _, existingClass := range existingClasses {
		found := false

		for _, updatedClass := range updatedClasses {
			if existingClass.Name == updatedClass.Name {
				found = true
			}
		}

		if !found {
			updatedClasses = append(updatedClasses, existingClass)
		}
	}
	endpoint.Kubernetes.Configuration.IngressClasses = updatedClasses

	err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesIngressControllersByNamespace").Str("namespace", namespace).Msg("Unable to store BlockedIngressClasses inside the database")
		return httperror.InternalServerError("Unable to store BlockedIngressClasses inside the database", err)
	}

	return response.Empty(w)
}

// @id GetAllKubernetesClusterIngresses
// @summary Get kubernetes ingresses at the cluster level
// @description Get kubernetes ingresses at the cluster level for the provided environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param withServices query boolean false "Lookup services associated with each ingress"
// @success 200 {array} models.K8sIngressInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve ingresses."
// @router /kubernetes/{id}/ingresses [get]
func (handler *Handler) GetAllKubernetesClusterIngresses(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	ingresses, err := handler.getKubernetesClusterIngresses(r)
	if err != nil {
		return err
	}

	return response.JSON(w, ingresses)
}

// @id GetAllKubernetesClusterIngressesCount
// @summary Get Ingresses count
// @description Get the number of kubernetes ingresses within the given environment.
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
// @failure 500 "Server error occurred while attempting to retrieve ingresses count."
// @router /kubernetes/{id}/ingresses/count [get]
func (handler *Handler) getAllKubernetesClusterIngressesCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	ingresses, err := handler.getKubernetesClusterIngresses(r)
	if err != nil {
		return err
	}

	return response.JSON(w, len(ingresses))
}

func (handler *Handler) getKubernetesClusterIngresses(r *http.Request) ([]models.K8sIngressInfo, *httperror.HandlerError) {
	withServices, err := request.RetrieveBooleanQueryParameter(r, "withServices", true)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesClusterIngresses").Msg("Unable to retrieve withApplications query parameter")
		return nil, httperror.BadRequest("Unable to retrieve withApplications query parameter", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getKubernetesClusterIngresses").Msg("Unable to get a Kubernetes client for the user")
		return nil, httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	ingresses, err := cli.GetIngresses("")
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesClusterIngresses").Msg("Unauthorized access to the Kubernetes API")
			return nil, httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "getKubernetesClusterIngresses").Msg("Unable to retrieve ingresses from the Kubernetes for a cluster level user")
			return nil, httperror.NotFound("Unable to retrieve ingresses from the Kubernetes for a cluster level user", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesClusterIngresses").Msg("Unable to retrieve ingresses from the Kubernetes for a cluster level user")
		return nil, httperror.InternalServerError("Unable to retrieve ingresses from the Kubernetes for a cluster level user", err)
	}

	if withServices {
		ingressesWithServices, err := cli.CombineIngressesWithServices(ingresses)
		if err != nil {
			log.Error().Err(err).Str("context", "getKubernetesClusterIngresses").Msg("Unable to combine ingresses with services")
			return nil, httperror.InternalServerError("Unable to combine ingresses with services", err)
		}

		return ingressesWithServices, nil
	}

	return ingresses, nil
}

// @id GetAllKubernetesIngresses
// @summary Get a list of Ingresses
// @description Get a list of Ingresses. If namespace is provided, it will return the list of Ingresses in that namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @success 200 {array} models.K8sIngressInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve ingresses"
// @router /kubernetes/{id}/namespaces/{namespace}/ingresses [get]
func (handler *Handler) getKubernetesIngresses(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesIngresses").Msg("Unable to retrieve namespace from request")
		return httperror.BadRequest("Unable to retrieve namespace from request", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	ingresses, err := cli.GetIngresses(namespace)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesIngresses").Str("namespace", namespace).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesIngresses").Str("namespace", namespace).Msg("Unable to retrieve ingresses from the Kubernetes for a namespace level user")
		return httperror.InternalServerError("Unable to retrieve ingresses from the Kubernetes for a namespace level user", err)
	}

	return response.JSON(w, ingresses)
}

// @id GetKubernetesIngress
// @summary Get an Ingress by name
// @description Get an Ingress by name for the provided environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @param ingress path string true "Ingress name"
// @success 200 {object} models.K8sIngressInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find an ingress with the specified name."
// @failure 500 "Server error occurred while attempting to retrieve an ingress."
// @router /kubernetes/{id}/namespaces/{namespace}/ingresses/{ingress} [get]
func (handler *Handler) getKubernetesIngress(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesIngress").Msg("Unable to retrieve namespace from request")
		return httperror.BadRequest("Unable to retrieve namespace from request", err)
	}

	ingressName, err := request.RetrieveRouteVariableValue(r, "ingress")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesIngress").Msg("Unable to retrieve ingress from request")
		return httperror.BadRequest("Unable to retrieve ingress from request", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	ingress, err := cli.GetIngress(namespace, ingressName)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesIngress").Str("namespace", namespace).Str("ingress", ingressName).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "getKubernetesIngress").Str("namespace", namespace).Str("ingress", ingressName).Msg("Unable to retrieve ingress from the Kubernetes for a namespace level user")
			return httperror.NotFound("Unable to retrieve ingress from the Kubernetes for a namespace level user", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesIngress").Str("namespace", namespace).Str("ingress", ingressName).Msg("Unable to retrieve ingress from the Kubernetes for a namespace level user")
		return httperror.InternalServerError("Unable to retrieve ingress from the Kubernetes for a namespace level user", err)
	}

	return response.JSON(w, ingress)
}

// @id CreateKubernetesIngress
// @summary Create an Ingress
// @description Create an Ingress for the provided environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @param body body models.K8sIngressInfo true "Ingress details"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 409 "Conflict - an ingress with the same name already exists in the specified namespace."
// @failure 500 "Server error occurred while attempting to create an ingress."
// @router /kubernetes/{id}/namespaces/{namespace}/ingresses [post]
func (handler *Handler) createKubernetesIngress(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "createKubernetesIngress").Msg("Unable to retrieve namespace from request")
		return httperror.BadRequest("Unable to retrieve namespace from request", err)
	}

	payload := models.K8sIngressInfo{}
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		log.Error().Err(err).Str("context", "createKubernetesIngress").Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("Unable to decode and validate the request payload", err)
	}

	owner := "admin"
	tokenData, err := security.RetrieveTokenData(r)
	if err == nil && tokenData != nil {
		owner = tokenData.Username
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.CreateIngress(namespace, payload, owner)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "createKubernetesIngress").Str("namespace", namespace).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsAlreadyExists(err) {
			log.Error().Err(err).Str("context", "createKubernetesIngress").Str("namespace", namespace).Msg("Ingress already exists")
			return httperror.Conflict("Ingress already exists", err)
		}

		log.Error().Err(err).Str("context", "createKubernetesIngress").Str("namespace", namespace).Msg("Unable to create an ingress")
		return httperror.InternalServerError("Unable to create an ingress", err)
	}

	return response.Empty(w)
}

// @id DeleteKubernetesIngresses
// @summary Delete one or more Ingresses
// @description Delete one or more Ingresses in the provided environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param body body models.K8sIngressDeleteRequests true "Ingress details"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find a specific ingress."
// @failure 500 "Server error occurred while attempting to delete specified ingresses."
// @router /kubernetes/{id}/ingresses/delete [post]
func (handler *Handler) deleteKubernetesIngresses(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	payload := models.K8sIngressDeleteRequests{}
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		log.Error().Err(err).Str("context", "deleteKubernetesIngresses").Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("Unable to decode and validate the request payload", err)
	}

	err = cli.DeleteIngresses(payload)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "deleteKubernetesIngresses").Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "deleteKubernetesIngresses").Msg("Unable to retrieve ingresses from the Kubernetes for a namespace level user")
			return httperror.NotFound("Unable to retrieve ingresses from the Kubernetes for a namespace level user", err)
		}

		log.Error().Err(err).Str("context", "deleteKubernetesIngresses").Msg("Unable to delete ingresses")
		return httperror.InternalServerError("Unable to delete ingresses", err)
	}

	return response.Empty(w)
}

// @id UpdateKubernetesIngress
// @summary Update an Ingress
// @description Update an Ingress for the provided environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @param body body models.K8sIngressInfo true "Ingress details"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find the specified ingress."
// @failure 500 "Server error occurred while attempting to update the specified ingress."
// @router /kubernetes/{id}/namespaces/{namespace}/ingresses [put]
func (handler *Handler) updateKubernetesIngress(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesIngress").Msg("Unable to retrieve namespace from request")
		return httperror.BadRequest("Unable to retrieve namespace from request", err)
	}

	payload := models.K8sIngressInfo{}
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesIngress").Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("Unable to decode and validate the request payload", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.UpdateIngress(namespace, payload)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "updateKubernetesIngress").Str("namespace", namespace).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "updateKubernetesIngress").Str("namespace", namespace).Msg("Unable to retrieve ingresses from the K	ubernetes for a namespace level user")
			return httperror.NotFound("Unable to retrieve ingresses from the Kubernetes for a namespace level user", err)
		}

		log.Error().Err(err).Str("context", "updateKubernetesIngress").Str("namespace", namespace).Msg("Unable to update ingress in a namespace")
		return httperror.InternalServerError("Unable to update ingress in a namespace", err)
	}

	return response.Empty(w)
}
