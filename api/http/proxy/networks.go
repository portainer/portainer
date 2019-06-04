package proxy

import (
	"net/http"

	"github.com/portainer/portainer/api"
)

const (
	// ErrDockerNetworkIdentifierNotFound defines an error raised when Portainer is unable to find a network identifier
	ErrDockerNetworkIdentifierNotFound = portainer.Error("Docker network identifier not found")
	networkIdentifier                  = "Id"
	networkLabelForStackIdentifier     = "com.docker.stack.namespace"
)

// networkListOperation extracts the response as a JSON object, loop through the networks array
// decorate and/or filter the networks based on resource controls before rewriting the response
func networkListOperation(response *http.Response, executor *operationExecutor) error {
	var err error
	// NetworkList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
	responseArray, err := getResponseAsJSONArray(response)
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

	return rewriteResponse(response, responseArray, http.StatusOK)
}

// networkInspectOperation extracts the response as a JSON object, verify that the user
// has access to the network based on resource control and either rewrite an access denied response
// or a decorated network.
func networkInspectOperation(response *http.Response, executor *operationExecutor) error {
	// NetworkInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/NetworkInspect
	responseObject, err := getResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[networkIdentifier] == nil {
		return ErrDockerNetworkIdentifierNotFound
	}

	networkID := responseObject[networkIdentifier].(string)
	responseObject, access := applyResourceAccessControl(responseObject, networkID, executor.operationContext)
	if access {
		return rewriteResponse(response, responseObject, http.StatusOK)
	}

	networkLabels := extractNetworkLabelsFromNetworkInspectObject(responseObject)
	responseObject, access = applyResourceAccessControlFromLabel(networkLabels, responseObject, networkLabelForStackIdentifier, executor.operationContext)
	if access {
		return rewriteResponse(response, responseObject, http.StatusOK)
	}

	return rewriteAccessDeniedResponse(response)
}

// extractNetworkLabelsFromNetworkInspectObject retrieve the Labels of the network if present.
// Container schema reference: https://docs.docker.com/engine/api/v1.28/#operation/NetworkInspect
func extractNetworkLabelsFromNetworkInspectObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Labels
	return extractJSONField(responseObject, "Labels")
}

// extractNetworkLabelsFromNetworkListObject retrieve the Labels of the network if present.
// Network schema reference: https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
func extractNetworkLabelsFromNetworkListObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Labels
	return extractJSONField(responseObject, "Labels")
}

// decorateNetworkList loops through all networks and decorates any network with an existing resource control.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Network object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
func decorateNetworkList(networkData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedNetworkData := make([]interface{}, 0)

	for _, network := range networkData {

		networkObject := network.(map[string]interface{})
		if networkObject[networkIdentifier] == nil {
			return nil, ErrDockerNetworkIdentifierNotFound
		}

		networkID := networkObject[networkIdentifier].(string)
		networkObject = decorateResourceWithAccessControl(networkObject, networkID, resourceControls)

		networkLabels := extractNetworkLabelsFromNetworkListObject(networkObject)
		networkObject = decorateResourceWithAccessControlFromLabel(networkLabels, networkObject, networkLabelForStackIdentifier, resourceControls)

		decoratedNetworkData = append(decoratedNetworkData, networkObject)
	}

	return decoratedNetworkData, nil
}

// filterNetworkList loops through all networks and filters public networks (no associated resource control)
// as well as authorized networks (access granted to the user based on existing resource control).
// Authorized networks are decorated during the process.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Network object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
func filterNetworkList(networkData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredNetworkData := make([]interface{}, 0)

	for _, network := range networkData {
		networkObject := network.(map[string]interface{})
		if networkObject[networkIdentifier] == nil {
			return nil, ErrDockerNetworkIdentifierNotFound
		}

		networkID := networkObject[networkIdentifier].(string)
		networkObject, access := applyResourceAccessControl(networkObject, networkID, context)
		if !access {
			networkLabels := extractNetworkLabelsFromNetworkListObject(networkObject)
			networkObject, access = applyResourceAccessControlFromLabel(networkLabels, networkObject, networkLabelForStackIdentifier, context)
		}

		if access {
			filteredNetworkData = append(filteredNetworkData, networkObject)
		}
	}

	return filteredNetworkData, nil
}
