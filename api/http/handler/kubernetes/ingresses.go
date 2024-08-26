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
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// @id getKubernetesIngressControllers
// @summary Get a list of ingress controllers
// @description Get a list of ingress controllers for the given environment
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param allowedOnly query boolean false "Only return allowed ingress controllers"
// @success 200 {object} models.K8sIngressControllers "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve ingress controllers"
// @router /kubernetes/{id}/ingresscontrollers [get]
func (handler *Handler) getKubernetesIngressControllers(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesIngressControllers operation, unable to retrieve environment identifier from request. Error: ", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err != nil {
		if handler.DataStore.IsErrObjectNotFound(err) {
			return httperror.NotFound("an error occurred during the GetKubernetesIngressControllers operation, unable to find an environment with the specified identifier inside the database. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the GetKubernetesIngressControllers operation, unable to find an environment with the specified identifier inside the database. Error: ", err)
	}

	allowedOnly, err := request.RetrieveBooleanQueryParameter(r, "allowedOnly", true)
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesIngressControllers operation, unable to retrieve allowedOnly query parameter. Error: ", err)
	}

	cli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesIngressControllers operation, unable to get privileged kube client. Error: ", err)
	}

	controllers, err := cli.GetIngressControllers()
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			return httperror.Unauthorized("an error occurred during the GetKubernetesIngressControllers operation, unauthorized access to the Kubernetes API. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the GetKubernetesIngressControllers operation, unable to retrieve ingress controllers from the Kubernetes. Error: ", err)
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
		return httperror.InternalServerError("an error occurred during the GetKubernetesIngressControllers operation, unable to store found IngressClasses inside the database. Error: ", err)
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

// @id getKubernetesIngressControllersByNamespace
// @summary Get a list ingress controllers by namespace
// @description Get a list of ingress controllers for the given environment in the provided namespace
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace"
// @success 200 {object} models.K8sIngressControllers "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve ingress controllers by a namespace"
// @router /kubernetes/{id}/namespaces/{namespace}/ingresscontrollers [get]
func (handler *Handler) getKubernetesIngressControllersByNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesIngressControllersByNamespace operation, unable to retrieve environment identifier from request. Error: ", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err != nil {
		if handler.DataStore.IsErrObjectNotFound(err) {
			return httperror.NotFound("an error occurred during the GetKubernetesIngressControllersByNamespace operation, unable to find an environment with the specified identifier inside the database. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the GetKubernetesIngressControllersByNamespace operation, unable to find an environment with the specified identifier inside the database. Error: ", err)
	}

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesIngressControllersByNamespace operation, unable to retrieve namespace from request. Error: ", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	currentControllers, err := cli.GetIngressControllers()
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			return httperror.Unauthorized("an error occurred during the GetKubernetesIngressControllersByNamespace operation, unauthorized access to the Kubernetes API. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the GetKubernetesIngressControllersByNamespace operation, unable to retrieve ingress controllers from the Kubernetes. Error: ", err)
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
		return httperror.InternalServerError("an error occurred during the GetKubernetesIngressControllersByNamespace operation, unable to store found IngressClasses inside the database. Error: ", err)
	}
	return response.JSON(w, controllers)
}

// @id updateKubernetesIngressControllers
// @summary Update (block/unblock) ingress controllers
// @description Update (block/unblock) ingress controllers
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param body body []models.K8sIngressControllers true "Ingress controllers"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to update ingress controllers"
// @router /kubernetes/{id}/ingresscontrollers [put]
func (handler *Handler) updateKubernetesIngressControllers(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("an error occurred during the UpdateKubernetesIngressControllers operation, unable to retrieve environment identifier from request. Error: ", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err != nil {
		if handler.DataStore.IsErrObjectNotFound(err) {
			return httperror.NotFound("an error occurred during the UpdateKubernetesIngressControllers operation, unable to find an environment with the specified identifier inside the database. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the UpdateKubernetesIngressControllers operation, unable to find an environment with the specified identifier inside the database. Error: ", err)
	}

	payload := models.K8sIngressControllers{}
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("an error occurred during the UpdateKubernetesIngressControllers operation, unable to decode and validate the request payload. Error: ", err)
	}

	cli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return httperror.InternalServerError("an error occurred during the UpdateKubernetesIngressControllers operation, unable to get privileged kube client. Error: ", err)
	}

	existingClasses := endpoint.Kubernetes.Configuration.IngressClasses
	controllers, err := cli.GetIngressControllers()
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			return httperror.Unauthorized("an error occurred during the UpdateKubernetesIngressControllers operation, unauthorized access to the Kubernetes API. Error: ", err)
		}

		if k8serrors.IsNotFound(err) {
			return httperror.NotFound("an error occurred during the UpdateKubernetesIngressControllers operation, unable to retrieve ingress controllers from the Kubernetes. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the UpdateKubernetesIngressControllers operation, unable to retrieve ingress controllers from the Kubernetes. Error: ", err)
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
		return httperror.InternalServerError("an error occurred during the UpdateKubernetesIngressControllers operation, unable to store found IngressClasses inside the database. Error: ", err)
	}

	return response.Empty(w)
}

// @id updateKubernetesIngressControllersByNamespace
// @summary Update (block/unblock) ingress controllers by namespace
// @description Update (block/unblock) ingress controllers by namespace for the provided environment
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @param body body []models.K8sIngressControllers true "Ingress controllers"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to update ingress controllers by namespace"
// @router /kubernetes/{id}/namespaces/{namespace}/ingresscontrollers [put]
func (handler *Handler) updateKubernetesIngressControllersByNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.NotFound("an error occurred during the UpdateKubernetesIngressControllersByNamespace operation, unable to fetch endpoint. Error: ", err)
	}

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("an error occurred during the UpdateKubernetesIngressControllersByNamespace operation, unable to retrieve namespace from request. Error: ", err)
	}

	payload := models.K8sIngressControllers{}
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("an error occurred during the UpdateKubernetesIngressControllersByNamespace operation, unable to decode and validate the request payload. Error: ", err)
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
		if k8serrors.IsUnauthorized(err) {
			return httperror.Unauthorized("an error occurred during the UpdateKubernetesIngressControllersByNamespace operation, unauthorized access to the Kubernetes API. Error: ", err)
		}

		if k8serrors.IsNotFound(err) {
			return httperror.NotFound("an error occurred during the UpdateKubernetesIngressControllersByNamespace operation, unable to retrieve ingress controllers from the Kubernetes. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the UpdateKubernetesIngressControllersByNamespace operation, unable to store BlockedIngressClasses inside the database. Error: ", err)
	}

	return response.Empty(w)
}

// @id GetKubernetesClusterIngresses
// @summary Get kubernetes ingresses at the cluster level
// @description Get kubernetes ingresses at the cluster level for the provided environment
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param body body []models.K8sIngressInfo true "Ingress details"
// @param withServices query boolean false "Lookup services associated with each ingress"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve ingresses"
// @router /kubernetes/{id}/ingresses [get]
func (handler *Handler) GetKubernetesClusterIngresses(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	ingresses, err := handler.getKubernetesClusterIngresses(r)
	if err != nil {
		return err
	}

	return response.JSON(w, ingresses)
}

// @id getKubernetesClusterIngressesCount
// @summary Get the number of kubernetes ingresses within the given environment
// @description Get the number of kubernetes ingresses within the given environment
// @description **Access policy**: Authenticated users only.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 int "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve ingresses count"
// @router /kubernetes/{id}/ingresses/count [get]
func (handler *Handler) getKubernetesClusterIngressesCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	ingresses, err := handler.getKubernetesClusterIngresses(r)
	if err != nil {
		return err
	}

	return response.JSON(w, len(ingresses))
}

func (handler *Handler) getKubernetesClusterIngresses(r *http.Request) ([]models.K8sIngressInfo, *httperror.HandlerError) {
	withServices, err := request.RetrieveBooleanQueryParameter(r, "withServices", false)
	if err != nil {
		return nil, httperror.BadRequest("an error occurred during the GetKubernetesClusterIngresses operation, unable to retrieve withApplications query parameter. Error: ", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		return nil, httperror.InternalServerError("an error occurred during the GetKubernetesClusterIngresses operation, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	ingresses, err := cli.GetIngresses("")
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			return nil, httperror.Unauthorized("an error occurred during the GetKubernetesClusterIngresses operation, unauthorized access to the Kubernetes API. Error: ", err)
		}

		if k8serrors.IsNotFound(err) {
			return nil, httperror.NotFound("an error occurred during the GetKubernetesClusterIngresses operation, unable to retrieve ingresses from the Kubernetes for a cluster level user. Error: ", err)
		}

		return nil, httperror.InternalServerError("an error occurred during the GetKubernetesClusterIngresses operation, unable to retrieve ingresses from the Kubernetes for a cluster level user. Error: ", err)
	}

	if withServices {
		ingressesWithServices, err := cli.CombineIngressesWithServices(ingresses)
		if err != nil {
			return nil, httperror.InternalServerError("an error occurred during the GetKubernetesClusterIngresses operation, unable to combine ingresses with services. Error: ", err)
		}

		return ingressesWithServices, nil
	}

	return ingresses, nil
}

// @id getKubernetesIngresses
// @summary Get kubernetes ingresses by namespace
// @description Get kubernetes ingresses by namespace for the provided environment
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @param body body []models.K8sIngressInfo true "Ingress details"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve ingresses"
// @router /kubernetes/{id}/namespaces/{namespace}/ingresses [get]
func (handler *Handler) getKubernetesIngresses(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesIngresses operation, unable to retrieve namespace from request. Error: ", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	ingresses, err := cli.GetIngresses(namespace)
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			return httperror.Unauthorized("an error occurred during the GetKubernetesIngresses operation, unauthorized access to the Kubernetes API. Error: ", err)
		}

		if k8serrors.IsNotFound(err) {
			return httperror.NotFound("an error occurred during the GetKubernetesIngresses operation, unable to retrieve ingresses from the Kubernetes for a namespace level user. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the GetKubernetesIngresses operation, unable to retrieve ingresses from the Kubernetes for a namespace level user. Error: ", err)
	}

	return response.JSON(w, ingresses)
}

// @id getKubernetesIngress
// @summary Get a kubernetes ingress by namespace
// @description Get a kubernetes ingress by namespace for the provided environment
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @param ingress path string true "Ingress name"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve an ingress"
// @router /kubernetes/{id}/namespaces/{namespace}/ingresses/{ingress} [get]
func (handler *Handler) getKubernetesIngress(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesIngress operation, unable to retrieve namespace from request. Error: ", err)
	}

	ingressName, err := request.RetrieveRouteVariableValue(r, "ingress")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesIngress operation, unable to retrieve ingress from request. Error: ", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	ingress, err := cli.GetIngress(namespace, ingressName)
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			return httperror.Unauthorized("an error occurred during the GetKubernetesIngress operation, unauthorized access to the Kubernetes API. Error: ", err)
		}

		if k8serrors.IsNotFound(err) {
			return httperror.NotFound("an error occurred during the GetKubernetesIngress operation, unable to retrieve ingress from the Kubernetes for a namespace level user. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the GetKubernetesIngress operation, unable to retrieve ingress from the Kubernetes for a namespace level user. Error: ", err)
	}

	return response.JSON(w, ingress)
}

// @id createKubernetesIngress
// @summary Create a kubernetes ingress by namespace
// @description Create a kubernetes ingress by namespace for the provided environment
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @param body body models.K8sIngressInfo true "Ingress details"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to create an ingress"
// @router /kubernetes/{id}/namespaces/{namespace}/ingresses [post]
func (handler *Handler) createKubernetesIngress(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("an error occurred during the CreateKubernetesIngress operation, unable to retrieve namespace from request. Error: ", err)
	}

	payload := models.K8sIngressInfo{}
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("an error occurred during the CreateKubernetesIngress operation, unable to decode and validate the request payload. Error: ", err)
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
		if k8serrors.IsUnauthorized(err) {
			return httperror.Unauthorized("an error occurred during the CreateKubernetesIngress operation, unauthorized access to the Kubernetes API. Error: ", err)
		}

		if k8serrors.IsAlreadyExists(err) {
			return httperror.Conflict("an error occurred during the CreateKubernetesIngress operation, ingress already exists. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the CreateKubernetesIngress operation, unable to create an ingress. Error: ", err)
	}

	return response.Empty(w)
}

// @id deleteKubernetesIngresses
// @summary Delete kubernetes ingresses
// @description Delete kubernetes ingresses for the provided environment
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param body body models.K8sIngressDeleteRequests true "Ingress details"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to delete ingresses"
// @router /kubernetes/{id}/ingresses/delete [post]
func (handler *Handler) deleteKubernetesIngresses(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	payload := models.K8sIngressDeleteRequests{}
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("an error occurred during the DeleteKubernetesIngresses operation, unable to decode and validate the request payload. Error: ", err)
	}

	err = cli.DeleteIngresses(payload)
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			return httperror.Unauthorized("an error occurred during the DeleteKubernetesIngresses operation, unauthorized access to the Kubernetes API. Error: ", err)
		}

		if k8serrors.IsNotFound(err) {
			return httperror.NotFound("an error occurred during the DeleteKubernetesIngresses operation, unable to retrieve ingresses from the Kubernetes for a namespace level user. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the DeleteKubernetesIngresses operation, unable to delete ingresses. Error: ", err)
	}

	return response.Empty(w)
}

// @id updateKubernetesIngress
// @summary Update kubernetes ingress rule
// @description Update kubernetes ingress rule for the provided environment
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @param body body models.K8sIngressInfo true "Ingress details"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to update ingress in a namespace"
// @router /kubernetes/{id}/namespaces/{namespace}/ingresses [put]
func (handler *Handler) updateKubernetesIngress(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("an error occurred during the UpdateKubernetesIngress operation, unable to retrieve namespace from request. Error: ", err)
	}

	payload := models.K8sIngressInfo{}
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("an error occurred during the UpdateKubernetesIngress operation, unable to decode and validate the request payload. Error: ", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.UpdateIngress(namespace, payload)
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			return httperror.Unauthorized("an error occurred during the UpdateKubernetesIngress operation, unauthorized access to the Kubernetes API. Error: ", err)
		}

		if k8serrors.IsNotFound(err) {
			return httperror.NotFound("an error occurred during the UpdateKubernetesIngress operation, unable to retrieve ingresses from the Kubernetes for a namespace level user. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the UpdateKubernetesIngress operation, unable to update ingress in a namespace. Error: ", err)
	}

	return response.Empty(w)
}
