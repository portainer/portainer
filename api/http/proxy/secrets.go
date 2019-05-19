package proxy

import (
	"net/http"

	"github.com/portainer/portainer/api"
)

const (
	// ErrDockerSecretIdentifierNotFound defines an error raised when Portainer is unable to find a secret identifier
	ErrDockerSecretIdentifierNotFound = portainer.Error("Docker secret identifier not found")
	secretIdentifier                  = "ID"
)

// secretListOperation extracts the response as a JSON object, loop through the secrets array
// decorate and/or filter the secrets based on resource controls before rewriting the response
func secretListOperation(response *http.Response, executor *operationExecutor) error {
	var err error

	// SecretList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/SecretList
	responseArray, err := getResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess {
		responseArray, err = decorateSecretList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = filterSecretList(responseArray, executor.operationContext)
	}
	if err != nil {
		return err
	}

	return rewriteResponse(response, responseArray, http.StatusOK)
}

// secretInspectOperation extracts the response as a JSON object, verify that the user
// has access to the secret based on resource control (check are done based on the secretID and optional Swarm service ID)
// and either rewrite an access denied response or a decorated secret.
func secretInspectOperation(response *http.Response, executor *operationExecutor) error {
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
	responseObject, access := applyResourceAccessControl(responseObject, secretID, executor.operationContext)
	if !access {
		return rewriteAccessDeniedResponse(response)
	}

	return rewriteResponse(response, responseObject, http.StatusOK)
}

// decorateSecretList loops through all secrets and decorates any secret with an existing resource control.
// Resource controls checks are based on: resource identifier.
// Secret object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/SecretList
func decorateSecretList(secretData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedSecretData := make([]interface{}, 0)

	for _, secret := range secretData {

		secretObject := secret.(map[string]interface{})
		if secretObject[secretIdentifier] == nil {
			return nil, ErrDockerSecretIdentifierNotFound
		}

		secretID := secretObject[secretIdentifier].(string)
		secretObject = decorateResourceWithAccessControl(secretObject, secretID, resourceControls)

		decoratedSecretData = append(decoratedSecretData, secretObject)
	}

	return decoratedSecretData, nil
}

// filterSecretList loops through all secrets and filters public secrets (no associated resource control)
// as well as authorized secrets (access granted to the user based on existing resource control).
// Authorized secrets are decorated during the process.
// Resource controls checks are based on: resource identifier.
// Secret object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/SecretList
func filterSecretList(secretData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredSecretData := make([]interface{}, 0)

	for _, secret := range secretData {
		secretObject := secret.(map[string]interface{})
		if secretObject[secretIdentifier] == nil {
			return nil, ErrDockerSecretIdentifierNotFound
		}

		secretID := secretObject[secretIdentifier].(string)
		secretObject, access := applyResourceAccessControl(secretObject, secretID, context)
		if access {
			filteredSecretData = append(filteredSecretData, secretObject)
		}
	}

	return filteredSecretData, nil
}
