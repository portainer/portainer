package proxy

import (
	"net/http"

	"github.com/portainer/portainer/api"
)

const (
	// ErrDockerConfigIdentifierNotFound defines an error raised when Portainer is unable to find a config identifier
	ErrDockerConfigIdentifierNotFound = portainer.Error("Docker config identifier not found")
	configIdentifier                  = "ID"
)

// configListOperation extracts the response as a JSON object, loop through the configs array
// decorate and/or filter the configs based on resource controls before rewriting the response
func configListOperation(response *http.Response, executor *operationExecutor) error {
	var err error

	// ConfigList response is a JSON array
	// https://docs.docker.com/engine/api/v1.30/#operation/ConfigList
	responseArray, err := getResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess {
		responseArray, err = decorateConfigList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = filterConfigList(responseArray, executor.operationContext)
	}
	if err != nil {
		return err
	}

	return rewriteResponse(response, responseArray, http.StatusOK)
}

// configInspectOperation extracts the response as a JSON object, verify that the user
// has access to the config based on resource control (check are done based on the configID and optional Swarm service ID)
// and either rewrite an access denied response or a decorated config.
func configInspectOperation(response *http.Response, executor *operationExecutor) error {
	// ConfigInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.30/#operation/ConfigInspect
	responseObject, err := getResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[configIdentifier] == nil {
		return ErrDockerConfigIdentifierNotFound
	}

	configID := responseObject[configIdentifier].(string)
	responseObject, access := applyResourceAccessControl(responseObject, configID, executor.operationContext)
	if !access {
		return rewriteAccessDeniedResponse(response)
	}

	return rewriteResponse(response, responseObject, http.StatusOK)
}

// decorateConfigList loops through all configs and decorates any config with an existing resource control.
// Resource controls checks are based on: resource identifier.
// Config object schema reference: https://docs.docker.com/engine/api/v1.30/#operation/ConfigList
func decorateConfigList(configData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedConfigData := make([]interface{}, 0)

	for _, config := range configData {

		configObject := config.(map[string]interface{})
		if configObject[configIdentifier] == nil {
			return nil, ErrDockerConfigIdentifierNotFound
		}

		configID := configObject[configIdentifier].(string)
		configObject = decorateResourceWithAccessControl(configObject, configID, resourceControls)

		decoratedConfigData = append(decoratedConfigData, configObject)
	}

	return decoratedConfigData, nil
}

// filterConfigList loops through all configs and filters public configs (no associated resource control)
// as well as authorized configs (access granted to the user based on existing resource control).
// Authorized configs are decorated during the process.
// Resource controls checks are based on: resource identifier.
// Config object schema reference: https://docs.docker.com/engine/api/v1.30/#operation/ConfigList
func filterConfigList(configData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredConfigData := make([]interface{}, 0)

	for _, config := range configData {
		configObject := config.(map[string]interface{})
		if configObject[configIdentifier] == nil {
			return nil, ErrDockerConfigIdentifierNotFound
		}

		configID := configObject[configIdentifier].(string)
		configObject, access := applyResourceAccessControl(configObject, configID, context)
		if access {
			filteredConfigData = append(filteredConfigData, configObject)
		}
	}

	return filteredConfigData, nil
}
