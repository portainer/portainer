package kubernetes

import (
	"net/http"

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

	controllers := cli.GetIngressControllers()
	existingClasses := endpoint.Kubernetes.Configuration.IngressClasses
	for i := range controllers {
		controllers[i].Availability = true
		controllers[i].New = true

		// Check if the controller is blocked globally.
		for _, a := range existingClasses {
			controllers[i].New = false
			if controllers[i].ClassName != a.Name {
				continue
			}
			controllers[i].New = false

			// Skip over non-global blocks.
			if len(a.BlockedNamespaces) > 0 {
				continue
			}

			if controllers[i].ClassName == a.Name {
				controllers[i].Availability = !a.GloballyBlocked
			}
		}
	}

	// Update the database to match the list of found + modified controllers.
	// This includes pruning out controllers which no longer exist.
	var newClasses []portainer.KubernetesIngressClassConfig
	for _, controller := range controllers {
		var class portainer.KubernetesIngressClassConfig
		class.Name = controller.ClassName
		class.Type = controller.Type
		class.GloballyBlocked = !controller.Availability
		class.BlockedNamespaces = []string{}
		newClasses = append(newClasses, class)
	}
	endpoint.Kubernetes.Configuration.IngressClasses = newClasses
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

	cli := handler.KubernetesClient
	currentControllers := cli.GetIngressControllers()
	existingClasses := endpoint.Kubernetes.Configuration.IngressClasses
	var updatedClasses []portainer.KubernetesIngressClassConfig
	var controllers models.K8sIngressControllers
	for i := range currentControllers {
		var globallyblocked bool
		currentControllers[i].Availability = true
		currentControllers[i].New = true

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

			// Check if the current namespace is blocked.
			for _, ns := range existingClass.BlockedNamespaces {
				if namespace == ns {
					currentControllers[i].Availability = false
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
	controllers := cli.GetIngressControllers()
	for i := range controllers {
		// Set existing class data. So that we don't accidentally overwrite it
		// with blank data that isn't in the payload.
		for ii := range existingClasses {
			if controllers[i].ClassName == existingClasses[ii].Name {
				controllers[i].Availability = !existingClasses[ii].GloballyBlocked
			}
		}
	}

	for _, p := range payload {
		for i := range controllers {
			// Now set new payload data
			if p.ClassName == controllers[i].ClassName {
				controllers[i].Availability = p.Availability
			}
		}
	}

	// Update the database to match the list of found + modified controllers.
	// This includes pruning out controllers which no longer exist.
	var newClasses []portainer.KubernetesIngressClassConfig
	for _, controller := range controllers {
		var class portainer.KubernetesIngressClassConfig
		class.Name = controller.ClassName
		class.Type = controller.Type
		class.GloballyBlocked = !controller.Availability
		class.BlockedNamespaces = []string{}
		newClasses = append(newClasses, class)
	}

	endpoint.Kubernetes.Configuration.IngressClasses = newClasses
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
				updatedClasses = append(updatedClasses, existingClass)
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

				updatedClasses = append(updatedClasses, existingClass)
				continue PayloadLoop
			}

			// Handle "disallow"
			// If it's meant to be blocked we need to add the current
			// namespace. First, check if it's already in the
			// BlockedNamespaces and if not we append it.
			updatedClass.BlockedNamespaces = existingClass.BlockedNamespaces
			for _, ns := range updatedClass.BlockedNamespaces {
				if namespace == ns {
					updatedClasses = append(updatedClasses, existingClass)
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

	cli := handler.KubernetesClient
	ingresses, err := cli.GetIngresses(namespace)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to retrieve nodes limits",
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

	cli := handler.KubernetesClient
	err = cli.CreateIngress(namespace, payload)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to retrieve nodes limits",
			err,
		)
	}
	return response.Empty(w)
}

func (handler *Handler) deleteKubernetesIngresses(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli := handler.KubernetesClient

	var payload models.K8sIngressDeleteRequests
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	err = cli.DeleteIngresses(payload)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to retrieve nodes limits",
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

	cli := handler.KubernetesClient
	err = cli.UpdateIngress(namespace, payload)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to retrieve nodes limits",
			err,
		)
	}
	return response.Empty(w)
}
