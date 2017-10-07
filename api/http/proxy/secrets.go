package proxy

import (
	"net/http"

	"github.com/portainer/portainer"
)

const (
	// ErrDockerSecretIdentifierNotFound defines an error raised when Portainer is unable to find a secret identifier
	ErrDockerSecretIdentifierNotFound = portainer.Error("Docker secret identifier not found")
	secretIdentifier                  = "ID"
)

// secretListOperation extracts the response as a JSON object, loop through the secrets array
// decorate and/or filter the secrets based on resource controls before rewriting the response
func secretListOperation(request *http.Request, response *http.Response, executor *operationExecutor) error {
	var err error

	// SecretList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/SecretList
	responseArray, err := getResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin {
		responseArray, err = decorateSecretList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = filterSecretList(responseArray, executor.operationContext.resourceControls,
			executor.operationContext.userID, executor.operationContext.userTeamIDs)
	}
	if err != nil {
		return err
	}

	return rewriteResponse(response, responseArray, http.StatusOK)
}

// secretInspectOperation extracts the response as a JSON object, verify that the user
// has access to the secret based on resource control (check are done based on the secretID and optional Swarm service ID)
// and either rewrite an access denied response or a decorated secret.
func secretInspectOperation(request *http.Request, response *http.Response, executor *operationExecutor) error {
	// SecretInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/SecretInspect
	responseObject, err := getResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[secretIdentifier] == nil {
		return ErrDockerSecretIdentifierNotFound
	}
	secretID := responseObject[secretIdentifier].(string)

	resourceControl := getResourceControlByResourceID(secretID, executor.operationContext.resourceControls)
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
