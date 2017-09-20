package proxy

import (
	"net/http"

	"github.com/portainer/portainer"
)

const (
	// ErrDockerNetworkIdentifierNotFound defines an error raised when Portainer is unable to find a network identifier
	ErrDockerNetworkIdentifierNotFound = portainer.Error("Docker network identifier not found")
	networkIdentifier                  = "Id"
)

// networkListOperation extracts the response as a JSON object, loop through the networks array
// decorate and/or filter the networks based on resource controls before rewriting the response
func networkListOperation(request *http.Request, response *http.Response, executor *operationExecutor) error {
	var err error
	// NetworkList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
	responseArray, err := getResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin {
		responseArray, err = decorateNetworkList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = filterNetworkList(responseArray, executor.operationContext.resourceControls,
			executor.operationContext.userID, executor.operationContext.userTeamIDs)
	}
	if err != nil {
		return err
	}

	return rewriteResponse(response, responseArray, http.StatusOK)
}

// networkInspectOperation extracts the response as a JSON object, verify that the user
// has access to the network based on resource control and either rewrite an access denied response
// or a decorated network.
func networkInspectOperation(request *http.Request, response *http.Response, executor *operationExecutor) error {
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

	resourceControl := getResourceControlByResourceID(networkID, executor.operationContext.resourceControls)
	if resourceControl != nil {
		if executor.operationContext.isAdmin || canUserAccessResource(executor.operationContext.userID,
			executor.operationContext.userTeamIDs, resourceControl) {
			responseObject = decorateObject(responseObject, resourceControl)
		} else {
			return rewriteAccessDeniedResponse(response)
		}
	}

	return rewriteResponse(response, responseObject, http.StatusOK)
}
