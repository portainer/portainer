package docker

import (
	"net/http"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/responseutils"
)

const (
	errDockerNetworkIdentifierNotFound = portainer.Error("Docker network identifier not found")
	networkIdentifier                  = "Id"
	networkLabelForStackIdentifier     = "com.docker.stack.namespace"
)

// networkListOperation extracts the response as a JSON object, loop through the networks array
// decorate and/or filter the networks based on resource controls before rewriting the response
func networkListOperation(response *http.Response, executor *operationExecutor) error {
	var err error
	// NetworkList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
	responseArray, err := responseutils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess {
		responseArray, err = decorateNetworkList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = filterNetworkList(responseArray, executor.operationContext)
	}
	if err != nil {
		return err
	}

	return responseutils.RewriteResponse(response, responseArray, http.StatusOK)
}

// networkInspectOperation extracts the response as a JSON object, verify that the user
// has access to the network based on resource control and either rewrite an access denied response
// or a decorated network.
func networkInspectOperation(response *http.Response, executor *operationExecutor) error {
	// NetworkInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/NetworkInspect
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[networkIdentifier] == nil {
		return errDockerNetworkIdentifierNotFound
	}

	networkID := responseObject[networkIdentifier].(string)
	responseObject, access := applyResourceAccessControl(responseObject, networkID, executor.operationContext, portainer.NetworkResourceControl)
	if access {
		return responseutils.RewriteResponse(response, responseObject, http.StatusOK)
	}

	networkLabels := extractNetworkLabelsFromNetworkInspectObject(responseObject)
	responseObject, access = applyResourceAccessControlFromLabel(networkLabels, responseObject, networkLabelForStackIdentifier, executor.operationContext, portainer.StackResourceControl)
	if access {
		return responseutils.RewriteResponse(response, responseObject, http.StatusOK)
	}

	return responseutils.RewriteAccessDeniedResponse(response)
}

// extractNetworkLabelsFromNetworkInspectObject retrieve the Labels of the network if present.
// Container schema reference: https://docs.docker.com/engine/api/v1.28/#operation/NetworkInspect
func extractNetworkLabelsFromNetworkInspectObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Labels
	return responseutils.GetJSONObject(responseObject, "Labels")
}

// extractNetworkLabelsFromNetworkListObject retrieve the Labels of the network if present.
// Network schema reference: https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
func extractNetworkLabelsFromNetworkListObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Labels
	return responseutils.GetJSONObject(responseObject, "Labels")
}

// decorateNetworkList loops through all networks and decorates any network with an existing resource control.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Network object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
func decorateNetworkList(networkData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedNetworkData := make([]interface{}, 0)

	for _, network := range networkData {

		networkObject := network.(map[string]interface{})
		if networkObject[networkIdentifier] == nil {
			return nil, errDockerNetworkIdentifierNotFound
		}

		networkID := networkObject[networkIdentifier].(string)
		networkObject = decorateResourceWithAccessControl(networkObject, networkID, resourceControls, portainer.NetworkResourceControl)

		networkLabels := extractNetworkLabelsFromNetworkListObject(networkObject)
		networkObject = decorateResourceWithAccessControlFromLabel(networkLabels, networkObject, networkLabelForStackIdentifier, resourceControls, portainer.StackResourceControl)

		decoratedNetworkData = append(decoratedNetworkData, networkObject)
	}

	return decoratedNetworkData, nil
}

// filterNetworkList loops through all networks and filters authorized networks (access granted to the user based on existing resource control).
// Authorized networks are decorated during the process.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Network object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
func filterNetworkList(networkData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredNetworkData := make([]interface{}, 0)

	for _, network := range networkData {
		networkObject := network.(map[string]interface{})
		if networkObject[networkIdentifier] == nil {
			return nil, errDockerNetworkIdentifierNotFound
		}

		networkID := networkObject[networkIdentifier].(string)
		networkObject, access := applyResourceAccessControl(networkObject, networkID, context, portainer.NetworkResourceControl)
		if !access {
			networkLabels := extractNetworkLabelsFromNetworkListObject(networkObject)
			networkObject, access = applyResourceAccessControlFromLabel(networkLabels, networkObject, networkLabelForStackIdentifier, context, portainer.StackResourceControl)
		}

		if access {
			filteredNetworkData = append(filteredNetworkData, networkObject)
		}
	}

	return filteredNetworkData, nil
}
