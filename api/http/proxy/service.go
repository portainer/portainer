package proxy

import (
	"net/http"

	"github.com/portainer/portainer"
)

const (
	// ErrDockerServiceIdentifierNotFound defines an error raised when Portainer is unable to find a service identifier
	ErrDockerServiceIdentifierNotFound = portainer.Error("Docker service identifier not found")
	serviceIdentifier                  = "ID"
)

// serviceListOperation extracts the response as a JSON array, loop through the service array
// decorate and/or filter the services based on resource controls before rewriting the response
func serviceListOperation(request *http.Request, response *http.Response, executor *operationExecutor) error {
	var err error
	// ServiceList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
	responseArray, err := getResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin {
		responseArray, err = decorateServiceList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = filterServiceList(responseArray, executor.operationContext.resourceControls, executor.operationContext.userID, executor.operationContext.userTeamIDs)
	}
	if err != nil {
		return err
	}

	return rewriteResponse(response, responseArray, http.StatusOK)
}

// serviceInspectOperation extracts the response as a JSON object, verify that the user
// has access to the service based on resource control and either rewrite an access denied response
// or a decorated service.
func serviceInspectOperation(request *http.Request, response *http.Response, executor *operationExecutor) error {
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

	resourceControl := getResourceControlByResourceID(serviceID, executor.operationContext.resourceControls)
	if resourceControl != nil {
		if executor.operationContext.isAdmin || canUserAccessResource(executor.operationContext.userID, executor.operationContext.userTeamIDs, resourceControl) {
			responseObject = decorateObject(responseObject, resourceControl)
		} else {
			return rewriteAccessDeniedResponse(response)
		}
	}

	return rewriteResponse(response, responseObject, http.StatusOK)
}
