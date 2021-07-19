package docker

import (
	"context"
	"net/http"

	portainer "github.com/portainer/portainer/api"

	"github.com/docker/docker/api/types"

	"github.com/docker/docker/client"

	"github.com/portainer/portainer/api/http/proxy/factory/utils"
	"github.com/portainer/portainer/api/internal/authorization"
)

const (
	networkObjectIdentifier = "Id"
	networkObjectName       = "Name"
)

func getInheritedResourceControlFromNetworkLabels(dockerClient *client.Client, endpointID portainer.EndpointID, networkID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	network, err := dockerClient.NetworkInspect(context.Background(), networkID, types.NetworkInspectOptions{})
	if err != nil {
		return nil, err
	}

	stackResourceID := getStackResourceIDFromLabels(network.Labels, endpointID)
	if stackResourceID != "" {
		return authorization.GetResourceControlByResourceIDAndType(stackResourceID, portainer.StackResourceControl, resourceControls), nil
	}

	return nil, nil
}

// networkListOperation extracts the response as a JSON object, loop through the networks array
// decorate and/or filter the networks based on resource controls before rewriting the response.
func (transport *Transport) networkListOperation(response *http.Response, executor *operationExecutor) error {
	// NetworkList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
	responseArray, err := utils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: networkObjectIdentifier,
		resourceType:                portainer.NetworkResourceControl,
		labelsObjectSelector:        selectorNetworkLabels,
	}

	responseArray, err = transport.applyAccessControlOnResourceList(resourceOperationParameters, responseArray, executor)
	if err != nil {
		return err
	}

	return utils.RewriteResponse(response, responseArray, http.StatusOK)
}

// networkInspectOperation extracts the response as a JSON object, verify that the user
// has access to the network based on resource control and either rewrite an access denied response or a decorated network.
func (transport *Transport) networkInspectOperation(response *http.Response, executor *operationExecutor) error {
	// NetworkInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/NetworkInspect
	responseObject, err := utils.GetResponseAsJSONObject(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: networkObjectIdentifier,
		resourceType:                portainer.NetworkResourceControl,
		labelsObjectSelector:        selectorNetworkLabels,
	}

	return transport.applyAccessControlOnResource(resourceOperationParameters, responseObject, response, executor)
}

// findSystemNetworkResourceControl will check if the network object is a system network
// and will return a system resource control if that's the case.
func findSystemNetworkResourceControl(networkObject map[string]interface{}) *portainer.ResourceControl {
	if networkObject[networkObjectName] == nil {
		return nil
	}

	networkID := networkObject[networkObjectIdentifier].(string)
	networkName := networkObject[networkObjectName].(string)

	if networkName == "bridge" || networkName == "host" || networkName == "none" {
		return authorization.NewSystemResourceControl(networkID, portainer.NetworkResourceControl)
	}

	return nil
}

// selectorNetworkLabels retrieve the labels object associated to the network object.
// Labels are available under the "Labels" property.
// API schema references:
// https://docs.docker.com/engine/api/v1.28/#operation/NetworkInspect
// https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
func selectorNetworkLabels(responseObject map[string]interface{}) map[string]interface{} {
	return utils.GetJSONObject(responseObject, "Labels")
}
