package docker

import (
	"context"
	"errors"
	"net/http"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/responseutils"
)

const (
	serviceObjectIdentifier = "ID"
)

func getInheritedResourceControlFromServiceLabels(dockerClient *client.Client, serviceID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	service, _, err := dockerClient.ServiceInspectWithRaw(context.Background(), serviceID, types.ServiceInspectOptions{})
	if err != nil {
		return nil, err
	}

	swarmStackName := service.Spec.Labels[resourceLabelForDockerSwarmStackName]
	if swarmStackName != "" {
		return portainer.GetResourceControlByResourceIDAndType(swarmStackName, portainer.StackResourceControl, resourceControls), nil
	}

	return nil, nil
}

// serviceListOperation extracts the response as a JSON array, loop through the service array
// decorate and/or filter the services based on resource controls before rewriting the response
func (transport *Transport) serviceListOperation(response *http.Response, executor *operationExecutor) error {
	var err error
	// ServiceList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
	responseArray, err := responseutils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess {
		responseArray, err = transport.decorateServiceList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = transport.filterServiceList(responseArray, executor.operationContext)
	}
	if err != nil {
		return err
	}

	return responseutils.RewriteResponse(response, responseArray, http.StatusOK)
}

// serviceInspectOperation extracts the response as a JSON object, verify that the user
// has access to the service based on resource control and either rewrite an access denied response
// or a decorated service.
func (transport *Transport) serviceInspectOperation(response *http.Response, executor *operationExecutor) error {
	// ServiceInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/ServiceInspect
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[serviceObjectIdentifier] == nil {
		return errors.New("docker service identifier not found")
	}

	resourceControl, err := transport.findServiceResourceControl(responseObject, executor.operationContext.resourceControls)
	if err != nil {
		return err
	}

	if resourceControl == nil && (executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess) {
		return responseutils.RewriteResponse(response, responseObject, http.StatusOK)
	}

	if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess || portainer.UserCanAccessResource(executor.operationContext.userID, executor.operationContext.userTeamIDs, resourceControl) {
		responseObject = decorateObject(responseObject, resourceControl)
		return responseutils.RewriteResponse(response, responseObject, http.StatusOK)
	}

	return responseutils.RewriteAccessDeniedResponse(response)
}

// findServiceResourceControl will search for a resource control object associated to the service or
// inherited from a Swarm stack (based on labels).
// If no resource control is found, it will search for Portainer specific resource control labels and will generate
// a resource control based on these if they exist. Public access control label take precedence over user/team access control labels.
func (transport *Transport) findServiceResourceControl(responseObject map[string]interface{}, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	serviceID := responseObject[serviceObjectIdentifier].(string)

	resourceControl := portainer.GetResourceControlByResourceIDAndType(serviceID, portainer.ServiceResourceControl, resourceControls)
	if resourceControl != nil {
		return resourceControl, nil
	}

	serviceLabels := selectorServiceLabels(responseObject)
	if serviceLabels != nil {
		if serviceLabels[resourceLabelForDockerSwarmStackName] != nil {
			inheritedSwarmStackIdentifier := serviceLabels[resourceLabelForDockerSwarmStackName].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedSwarmStackIdentifier, portainer.StackResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl, nil
			}
		}

		return transport.newResourceControlFromPortainerLabels(serviceLabels, serviceID, portainer.ServiceResourceControl)
	}

	return nil, nil
}

// selectorServiceLabels retrieve the Labels of the service if present.
// Service schema references:
// https://docs.docker.com/engine/api/v1.28/#operation/ServiceInspect
// https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
func selectorServiceLabels(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Spec.Labels
	serviceSpecObject := responseutils.GetJSONObject(responseObject, "Spec")
	if serviceSpecObject != nil {
		return responseutils.GetJSONObject(serviceSpecObject, "Labels")
	}
	return nil
}

// decorateServiceList loops through all services and decorates any service with an existing resource control.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Service object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
func (transport *Transport) decorateServiceList(serviceData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedServiceData := make([]interface{}, 0)

	for _, service := range serviceData {

		serviceObject := service.(map[string]interface{})
		if serviceObject[serviceObjectIdentifier] == nil {
			return nil, errors.New("docker service identifier not found")
		}

		resourceControl, err := transport.findServiceResourceControl(serviceObject, resourceControls)
		if err != nil {
			return nil, err
		}

		if resourceControl != nil {
			serviceObject = decorateObject(serviceObject, resourceControl)
		}

		decoratedServiceData = append(decoratedServiceData, serviceObject)
	}

	return decoratedServiceData, nil
}

// filterServiceList loops through all services and filters authorized services (access granted to the user based on existing resource control).
// Authorized services are decorated during the process.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Service object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
func (transport *Transport) filterServiceList(serviceData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredServiceData := make([]interface{}, 0)

	for _, service := range serviceData {
		serviceObject := service.(map[string]interface{})
		if serviceObject[serviceObjectIdentifier] == nil {
			return nil, errors.New("docker service identifier not found")
		}

		resourceControl, err := transport.findServiceResourceControl(serviceObject, context.resourceControls)
		if err != nil {
			return nil, err
		}

		if resourceControl == nil {
			if context.isAdmin || context.endpointResourceAccess {
				filteredServiceData = append(filteredServiceData, serviceObject)
			}
			continue
		}

		if context.isAdmin || context.endpointResourceAccess || portainer.UserCanAccessResource(context.userID, context.userTeamIDs, resourceControl) {
			serviceObject = decorateObject(serviceObject, resourceControl)
			filteredServiceData = append(filteredServiceData, serviceObject)
		}
	}

	return filteredServiceData, nil
}
