package proxy

import (
	"net/http"

	"github.com/portainer/portainer/api"
)

const (
	// ErrDockerServiceIdentifierNotFound defines an error raised when Portainer is unable to find a service identifier
	ErrDockerServiceIdentifierNotFound = portainer.Error("Docker service identifier not found")
	serviceIdentifier                  = "ID"
	serviceLabelForStackIdentifier     = "com.docker.stack.namespace"
)

// serviceListOperation extracts the response as a JSON array, loop through the service array
// decorate and/or filter the services based on resource controls before rewriting the response
func serviceListOperation(response *http.Response, executor *operationExecutor) error {
	var err error
	// ServiceList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
	responseArray, err := getResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess {
		responseArray, err = decorateServiceList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = filterServiceList(responseArray, executor.operationContext)
	}
	if err != nil {
		return err
	}

	return rewriteResponse(response, responseArray, http.StatusOK)
}

// serviceInspectOperation extracts the response as a JSON object, verify that the user
// has access to the service based on resource control and either rewrite an access denied response
// or a decorated service.
func serviceInspectOperation(response *http.Response, executor *operationExecutor) error {
	// ServiceInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/ServiceInspect
	responseObject, err := getResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[serviceIdentifier] == nil {
		return ErrDockerServiceIdentifierNotFound
	}

	serviceID := responseObject[serviceIdentifier].(string)
	responseObject, access := applyResourceAccessControl(responseObject, serviceID, executor.operationContext)
	if access {
		return rewriteResponse(response, responseObject, http.StatusOK)
	}

	serviceLabels := extractServiceLabelsFromServiceInspectObject(responseObject)
	responseObject, access = applyResourceAccessControlFromLabel(serviceLabels, responseObject, serviceLabelForStackIdentifier, executor.operationContext)
	if access {
		return rewriteResponse(response, responseObject, http.StatusOK)
	}

	return rewriteAccessDeniedResponse(response)
}

// extractServiceLabelsFromServiceInspectObject retrieve the Labels of the service if present.
// Service schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ServiceInspect
func extractServiceLabelsFromServiceInspectObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Spec.Labels
	serviceSpecObject := extractJSONField(responseObject, "Spec")
	if serviceSpecObject != nil {
		return extractJSONField(serviceSpecObject, "Labels")
	}
	return nil
}

// extractServiceLabelsFromServiceListObject retrieve the Labels of the service if present.
// Service schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
func extractServiceLabelsFromServiceListObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Spec.Labels
	serviceSpecObject := extractJSONField(responseObject, "Spec")
	if serviceSpecObject != nil {
		return extractJSONField(serviceSpecObject, "Labels")
	}
	return nil
}

// decorateServiceList loops through all services and decorates any service with an existing resource control.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Service object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
func decorateServiceList(serviceData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedServiceData := make([]interface{}, 0)

	for _, service := range serviceData {

		serviceObject := service.(map[string]interface{})
		if serviceObject[serviceIdentifier] == nil {
			return nil, ErrDockerServiceIdentifierNotFound
		}

		serviceID := serviceObject[serviceIdentifier].(string)
		serviceObject = decorateResourceWithAccessControl(serviceObject, serviceID, resourceControls)

		serviceLabels := extractServiceLabelsFromServiceListObject(serviceObject)
		serviceObject = decorateResourceWithAccessControlFromLabel(serviceLabels, serviceObject, serviceLabelForStackIdentifier, resourceControls)

		decoratedServiceData = append(decoratedServiceData, serviceObject)
	}

	return decoratedServiceData, nil
}

// filterServiceList loops through all services and filters public services (no associated resource control)
// as well as authorized services (access granted to the user based on existing resource control).
// Authorized services are decorated during the process.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Service object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
func filterServiceList(serviceData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredServiceData := make([]interface{}, 0)

	for _, service := range serviceData {
		serviceObject := service.(map[string]interface{})
		if serviceObject[serviceIdentifier] == nil {
			return nil, ErrDockerServiceIdentifierNotFound
		}

		serviceID := serviceObject[serviceIdentifier].(string)
		serviceObject, access := applyResourceAccessControl(serviceObject, serviceID, context)
		if !access {
			serviceLabels := extractServiceLabelsFromServiceListObject(serviceObject)
			serviceObject, access = applyResourceAccessControlFromLabel(serviceLabels, serviceObject, serviceLabelForStackIdentifier, context)
		}

		if access {
			filteredServiceData = append(filteredServiceData, serviceObject)
		}
	}

	return filteredServiceData, nil
}
