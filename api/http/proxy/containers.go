package proxy

import (
	"net/http"

	"github.com/portainer/portainer"
)

const (
	// ErrDockerContainerIdentifierNotFound defines an error raised when Portainer is unable to find a container identifier
	ErrDockerContainerIdentifierNotFound = portainer.Error("Docker container identifier not found")
	containerIdentifier                  = "Id"
)

// containerListOperation extracts the response as a JSON object, loop through the containers array
// decorate and/or filter the containers based on resource controls before rewriting the response
func containerListOperation(request *http.Request, response *http.Response, operationContext *restrictedOperationContext) error {
	var err error
	// ContainerList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/ContainerList
	responseArray, err := getResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if operationContext.isAdmin {
		responseArray, err = decorateContainerList(responseArray, operationContext.resourceControls)
	} else {
		responseArray, err = filterContainerList(responseArray, operationContext.resourceControls, operationContext.userID, operationContext.userTeamIDs)
	}
	if err != nil {
		return err
	}

	return rewriteResponse(response, responseArray, http.StatusOK)
}

// containerInspectOperation extracts the response as a JSON object, verify that the user
// has access to the container based on resource control and either rewrite an access denied response
// or a decorated container.
func containerInspectOperation(request *http.Request, response *http.Response, operationContext *restrictedOperationContext) error {
	// ContainerInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/ContainerInspect
	responseObject, err := getResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[containerIdentifier] == nil {
		return ErrDockerContainerIdentifierNotFound
	}
	containerID := responseObject[containerIdentifier].(string)

	resourceControl := getResourceControlByResourceID(containerID, operationContext.resourceControls)
	if resourceControl != nil {
		if operationContext.isAdmin || canUserAccessResource(operationContext.userID, operationContext.userTeamIDs, resourceControl) {
			responseObject = decorateObject(responseObject, resourceControl)
		} else {
			return rewriteAccessDeniedResponse(response)
		}
	}

	return rewriteResponse(response, responseObject, http.StatusOK)
}
