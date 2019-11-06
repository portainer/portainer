package docker

import (
	"context"
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
// decorate and/or filter the services based on resource controls before rewriting the response.
func (transport *Transport) serviceListOperation(response *http.Response, executor *operationExecutor) error {
	// ServiceList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
	responseArray, err := responseutils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: serviceObjectIdentifier,
		resourceType:                portainer.ServiceResourceControl,
		labelsObjectSelector:        selectorServiceLabels,
	}

	responseArray, err = transport.applyAccessControlOnResourceList(resourceOperationParameters, responseArray, executor)
	if err != nil {
		return err
	}

	return responseutils.RewriteResponse(response, responseArray, http.StatusOK)
}

// serviceInspectOperation extracts the response as a JSON object, verify that the user
// has access to the service based on resource control and either rewrite an access denied response or a decorated service.
func (transport *Transport) serviceInspectOperation(response *http.Response, executor *operationExecutor) error {
	//ServiceInspect response is a JSON object
	//https://docs.docker.com/engine/api/v1.28/#operation/ServiceInspect
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: serviceObjectIdentifier,
		resourceType:                portainer.ServiceResourceControl,
		labelsObjectSelector:        selectorServiceLabels,
	}

	return transport.applyAccessControlOnResource(resourceOperationParameters, responseObject, response, executor)
}

// selectorServiceLabels retrieve the labels object associated to the service object.
// Labels are available under the "Spec.Labels" property.
// API schema references:
// https://docs.docker.com/engine/api/v1.28/#operation/ServiceInspect
// https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
func selectorServiceLabels(responseObject map[string]interface{}) map[string]interface{} {
	serviceSpecObject := responseutils.GetJSONObject(responseObject, "Spec")
	if serviceSpecObject != nil {
		return responseutils.GetJSONObject(serviceSpecObject, "Labels")
	}
	return nil
}
