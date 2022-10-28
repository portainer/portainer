package kubernetes

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/models"
	portainerDsErrors "github.com/portainer/portainer/api/dataservices/errors"
)

func (handler *Handler) getKubernetesIngressControllers(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	endpoint, err := handler.dataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == portainerDsErrors.ErrObjectNotFound {
		return httperror.NotFound(
			"Unable to find an environment with the specified identifier inside the database",
			err,
		)
	} else if err != nil {
		return httperror.InternalServerError(
			"Unable to find an environment with the specified identifier inside the database",
			err,
		)
	}

	allowedOnly, err := request.RetrieveBooleanQueryParameter(r, "allowedOnly", true)
	if err != nil {
		return httperror.BadRequest(
			"Invalid allowedOnly boolean query parameter",
			err,
		)
	}

	cli, err := handler.kubernetesClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to create Kubernetes client",
			err,
		)
	}

	controllers, err := cli.GetIngressControllers()
	if err != nil {
		return httperror.InternalServerError(
			"Failed to fetch ingressclasses",
			err,
		)
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
	var updatedClasses []portainer.KubernetesIngressClassConfig
	for i := range controllers {
		controllers[i].Availability = true
		if controllers[i].ClassName != "none" {
			controllers[i].New = true
		}

		var updatedClass portainer.KubernetesIngressClassConfig
		updatedClass.Name = controllers[i].ClassName
		updatedClass.Type = controllers[i].Type

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
	err = handler.dataStore.Endpoint().UpdateEndpoint(
		portainer.EndpointID(endpointID),
		endpoint,
	)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to store found IngressClasses inside the database",
			err,
		)
	}

	// If the allowedOnly query parameter was set. We need to prune out
	// disallowed controllers from the response.
	if allowedOnly {
		var allowedControllers models.K8sIngressControllers
		for _, controller := range controllers {
			if controller.Availability {
				allowedControllers = append(allowedControllers, controller)
			}
		}
		controllers = allowedControllers
	}
	return response.JSON(w, controllers)
}

func (handler *Handler) getKubernetesIngressControllersByNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	endpoint, err := handler.dataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == portainerDsErrors.ErrObjectNotFound {
		return httperror.NotFound(
			"Unable to find an environment with the specified identifier inside the database",
			err,
		)
	} else if err != nil {
		return httperror.InternalServerError(
			"Unable to find an environment with the specified identifier inside the database",
			err,
		)
	}

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}

	cli, ok := handler.kubernetesClientFactory.GetProxyKubeClient(
		strconv.Itoa(endpointID), r.Header.Get("Authorization"),
	)
	if !ok {
		return httperror.InternalServerError(
			"Failed to lookup KubeClient",
			nil,
		)
	}

	currentControllers, err := cli.GetIngressControllers()
	if err != nil {
		return httperror.InternalServerError(
			"Failed to fetch ingressclasses",
			err,
		)
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
	var updatedClasses []portainer.KubernetesIngressClassConfig
	var controllers models.K8sIngressControllers
	for i := range currentControllers {
		var globallyblocked bool
		currentControllers[i].Availability = true
		if currentControllers[i].ClassName != "none" {
			currentControllers[i].New = true
		}

		var updatedClass portainer.KubernetesIngressClassConfig
		updatedClass.Name = currentControllers[i].ClassName
		updatedClass.Type = currentControllers[i].Type

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
	err = handler.dataStore.Endpoint().UpdateEndpoint(
		portainer.EndpointID(endpointID),
		endpoint,
	)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to store found IngressClasses inside the database",
			err,
		)
	}
	return response.JSON(w, controllers)
}

func (handler *Handler) updateKubernetesIngressControllers(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	endpoint, err := handler.dataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == portainerDsErrors.ErrObjectNotFound {
		return httperror.NotFound(
			"Unable to find an environment with the specified identifier inside the database",
			err,
		)
	} else if err != nil {
		return httperror.InternalServerError(
			"Unable to find an environment with the specified identifier inside the database",
			err,
		)
	}

	var payload models.K8sIngressControllers
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest(
			"Invalid request payload",
			err,
		)
	}

	cli, err := handler.kubernetesClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to create Kubernetes client",
			err,
		)
	}

	existingClasses := endpoint.Kubernetes.Configuration.IngressClasses
	controllers, err := cli.GetIngressControllers()
	if err != nil {
		return httperror.InternalServerError(
			"Unable to get ingress controllers",
			err,
		)
	}

	// Add none controller if "AllowNone" is set for endpoint.
	if endpoint.Kubernetes.Configuration.AllowNoneIngressClass {
		controllers = append(controllers, models.K8sIngressController{
			Name:      "none",
			ClassName: "none",
			Type:      "custom",
		})
	}

	var updatedClasses []portainer.KubernetesIngressClassConfig
	for i := range controllers {
		controllers[i].Availability = true
		controllers[i].New = true

		var updatedClass portainer.KubernetesIngressClassConfig
		updatedClass.Name = controllers[i].ClassName
		updatedClass.Type = controllers[i].Type

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
	err = handler.dataStore.Endpoint().UpdateEndpoint(
		portainer.EndpointID(endpointID),
		endpoint,
	)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to update the BlockedIngressClasses inside the database",
			err,
		)
	}
	return response.Empty(w)
}

func (handler *Handler) updateKubernetesIngressControllersByNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	endpoint, err := handler.dataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == portainerDsErrors.ErrObjectNotFound {
		return httperror.NotFound(
			"Unable to find an environment with the specified identifier inside the database",
			err,
		)
	} else if err != nil {
		return httperror.InternalServerError(
			"Unable to find an environment with the specified identifier inside the database",
			err,
		)
	}

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}

	var payload models.K8sIngressControllers
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest(
			"Invalid request payload",
			err,
		)
	}

	existingClasses := endpoint.Kubernetes.Configuration.IngressClasses
	var updatedClasses []portainer.KubernetesIngressClassConfig
PayloadLoop:
	for _, p := range payload {
		for _, existingClass := range existingClasses {
			if p.ClassName != existingClass.Name {
				continue
			}
			var updatedClass portainer.KubernetesIngressClassConfig
			updatedClass.Name = existingClass.Name
			updatedClass.Type = existingClass.Type
			updatedClass.GloballyBlocked = existingClass.GloballyBlocked

			// Handle "allow"
			if p.Availability == true {
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
			updatedClass.BlockedNamespaces = append(
				updatedClass.BlockedNamespaces,
				namespace,
			)
			updatedClasses = append(updatedClasses, updatedClass)
		}
	}

	// At this point it's possible we had an existing class which was globally
	// blocked and thus not included in the payload. As a result it is not yet
	// part of updatedClasses, but we MUST include it or we would remove the
	// global block.
	for _, existingClass := range existingClasses {
		var found bool

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
	err = handler.dataStore.Endpoint().UpdateEndpoint(
		portainer.EndpointID(endpointID),
		endpoint,
	)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to update the BlockedIngressClasses inside the database",
			err,
		)
	}
	return response.Empty(w)
}

func (handler *Handler) getKubernetesIngresses(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}

	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	cli, ok := handler.kubernetesClientFactory.GetProxyKubeClient(
		strconv.Itoa(endpointID), r.Header.Get("Authorization"),
	)
	if !ok {
		return httperror.InternalServerError(
			"Failed to lookup KubeClient",
			nil,
		)
	}

	ingresses, err := cli.GetIngresses(namespace)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to retrieve ingresses",
			err,
		)
	}

	return response.JSON(w, ingresses)
}

func (handler *Handler) createKubernetesIngress(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}

	var payload models.K8sIngressInfo
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest(
			"Invalid request payload",
			err,
		)
	}

	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	cli, ok := handler.kubernetesClientFactory.GetProxyKubeClient(
		strconv.Itoa(endpointID), r.Header.Get("Authorization"),
	)
	if !ok {
		return httperror.InternalServerError(
			"Failed to lookup KubeClient",
			nil,
		)
	}

	err = cli.CreateIngress(namespace, payload)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to retrieve the ingress",
			err,
		)
	}
	return response.Empty(w)
}

func (handler *Handler) deleteKubernetesIngresses(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	cli, ok := handler.kubernetesClientFactory.GetProxyKubeClient(
		strconv.Itoa(endpointID), r.Header.Get("Authorization"),
	)
	if !ok {
		return httperror.InternalServerError(
			"Failed to lookup KubeClient",
			nil,
		)
	}

	var payload models.K8sIngressDeleteRequests
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	err = cli.DeleteIngresses(payload)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to delete ingresses",
			err,
		)
	}
	return response.Empty(w)
}

func (handler *Handler) updateKubernetesIngress(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}

	var payload models.K8sIngressInfo
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest(
			"Invalid request payload",
			err,
		)
	}

	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	cli, ok := handler.kubernetesClientFactory.GetProxyKubeClient(
		strconv.Itoa(endpointID), r.Header.Get("Authorization"),
	)
	if !ok {
		return httperror.InternalServerError(
			"Failed to lookup KubeClient",
			nil,
		)
	}

	err = cli.UpdateIngress(namespace, payload)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to update the ingress",
			err,
		)
	}
	return response.Empty(w)
}
