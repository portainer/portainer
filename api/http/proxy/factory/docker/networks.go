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
	networkObjectIdentifier = "Id"
	networkObjectName       = "Name"
)

func getInheritedResourceControlFromNetworkLabels(dockerClient *client.Client, networkID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	network, err := dockerClient.NetworkInspect(context.Background(), networkID, types.NetworkInspectOptions{})
	if err != nil {
		return nil, err
	}

	swarmStackName := network.Labels[resourceLabelForDockerSwarmStackName]
	if swarmStackName != "" {
		return portainer.GetResourceControlByResourceIDAndType(swarmStackName, portainer.StackResourceControl, resourceControls), nil
	}

	return nil, nil
}

// networkListOperation extracts the response as a JSON object, loop through the networks array
// decorate and/or filter the networks based on resource controls before rewriting the response
func (transport *Transport) networkListOperation(response *http.Response, executor *operationExecutor) error {
	var err error
	// NetworkList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
	responseArray, err := responseutils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess {
		responseArray, err = transport.decorateNetworkList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = transport.filterNetworkList(responseArray, executor.operationContext)
	}
	if err != nil {
		return err
	}

	return responseutils.RewriteResponse(response, responseArray, http.StatusOK)
}

// networkInspectOperation extracts the response as a JSON object, verify that the user
// has access to the network based on resource control and either rewrite an access denied response
// or a decorated network.
func (transport *Transport) networkInspectOperation(response *http.Response, executor *operationExecutor) error {
	// NetworkInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/NetworkInspect
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[networkObjectIdentifier] == nil {
		return errors.New("docker network identifier not found in response")
	}

	systemResourceControl := findSystemNetworkResourceControl(responseObject)
	if systemResourceControl != nil {
		responseObject = decorateObject(responseObject, systemResourceControl)
		return responseutils.RewriteResponse(response, responseObject, http.StatusOK)
	}

	resourceControl, err := transport.findNetworkResourceControl(responseObject, executor.operationContext.resourceControls)
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

// findSystemNetworkResourceControl will check if the network object is a system network
// and will return a system resource control if that's the case.
func findSystemNetworkResourceControl(networkObject map[string]interface{}) *portainer.ResourceControl {
	if networkObject[networkObjectName] == nil {
		return nil
	}

	networkID := networkObject[networkObjectIdentifier].(string)
	networkName := networkObject[networkObjectName].(string)

	if networkName == "bridge" || networkName == "host" || networkName == "none" {
		return portainer.NewSystemResourceControl(networkID, portainer.NetworkResourceControl)
	}

	return nil
}

// findInheritedNetworkResourceControl will search for a resource control object associated to the network or
// inherited from a Swarm stack (based on labels).
// If no resource control is found, it will search for Portainer specific resource control labels and will generate
// a resource control based on these if they exist. Public access control label take precedence over user/team access control labels.
func (transport *Transport) findNetworkResourceControl(responseObject map[string]interface{}, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	networkID := responseObject[networkObjectIdentifier].(string)

	resourceControl := portainer.GetResourceControlByResourceIDAndType(networkID, portainer.NetworkResourceControl, resourceControls)
	if resourceControl != nil {
		return resourceControl, nil
	}

	networkLabels := selectorNetworkLabels(responseObject)
	if networkLabels != nil {
		if networkLabels[resourceLabelForDockerSwarmStackName] != nil {
			inheritedSwarmStackIdentifier := networkLabels[resourceLabelForDockerSwarmStackName].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedSwarmStackIdentifier, portainer.StackResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl, nil
			}
		}

		return transport.newResourceControlFromPortainerLabels(networkLabels, networkID, portainer.NetworkResourceControl)
	}

	return nil, nil
}

// selectorNetworkLabels retrieve the Labels of the network if present.
// Network schema references:
// https://docs.docker.com/engine/api/v1.28/#operation/NetworkInspect
// https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
func selectorNetworkLabels(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Labels
	return responseutils.GetJSONObject(responseObject, "Labels")
}

// decorateNetworkList loops through all networks and decorates any network with an existing resource control.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Resources controls can also be generated on the fly via specific Portainer labels.
// Network object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
func (transport *Transport) decorateNetworkList(networkData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedNetworkData := make([]interface{}, 0)

	for _, network := range networkData {

		networkObject := network.(map[string]interface{})
		if networkObject[networkObjectIdentifier] == nil {
			return nil, errors.New("docker network identifier not found in response")
		}

		systemResourceControl := findSystemNetworkResourceControl(networkObject)
		if systemResourceControl != nil {
			networkObject = decorateObject(networkObject, systemResourceControl)
			decoratedNetworkData = append(decoratedNetworkData, networkObject)
			continue
		}

		resourceControl, err := transport.findNetworkResourceControl(networkObject, resourceControls)
		if err != nil {
			return nil, err
		}

		if resourceControl != nil {
			networkObject = decorateObject(networkObject, resourceControl)
		}

		decoratedNetworkData = append(decoratedNetworkData, networkObject)
	}

	return decoratedNetworkData, nil
}

// filterNetworkList loops through all networks and filters authorized networks (access granted to the user based on existing resource control).
// Authorized networks are decorated during the process.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Resources controls can also be generated on the fly via specific Portainer labels.
// Network object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
func (transport *Transport) filterNetworkList(networkData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredNetworkData := make([]interface{}, 0)

	for _, network := range networkData {
		networkObject := network.(map[string]interface{})
		if networkObject[networkObjectIdentifier] == nil {
			return nil, errors.New("docker network identifier not found in response")
		}

		systemResourceControl := findSystemNetworkResourceControl(networkObject)
		if systemResourceControl != nil {
			networkObject = decorateObject(networkObject, systemResourceControl)
			filteredNetworkData = append(filteredNetworkData, networkObject)
			continue
		}

		resourceControl, err := transport.findNetworkResourceControl(networkObject, context.resourceControls)
		if err != nil {
			return nil, err
		}

		if resourceControl == nil {
			if context.isAdmin || context.endpointResourceAccess {
				filteredNetworkData = append(filteredNetworkData, networkObject)
			}
			continue
		}

		if context.isAdmin || context.endpointResourceAccess || portainer.UserCanAccessResource(context.userID, context.userTeamIDs, resourceControl) {
			networkObject = decorateObject(networkObject, resourceControl)
			filteredNetworkData = append(filteredNetworkData, networkObject)
		}
	}

	return filteredNetworkData, nil
}
