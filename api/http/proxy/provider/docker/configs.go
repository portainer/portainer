package docker

import (
	"net/http"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/responseutils"
)

const (
	errDockerConfigIdentifierNotFound = portainer.Error("Docker config identifier not found")
	// identifier attribute in inspect/list response
	configObjectIdentifier = "ID"
	// identifier attribute in config creation response
	configCreationIdentifier = "Id"
)

// configListOperation extracts the response as a JSON object, loop through the configs array
// decorate and/or filter the configs based on resource controls before rewriting the response
func configListOperation(response *http.Response, executor *operationExecutor) error {
	var err error

	// ConfigList response is a JSON array
	// https://docs.docker.com/engine/api/v1.30/#operation/ConfigList
	responseArray, err := responseutils.GetResponseAsJSONArray(response)
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

	return responseutils.RewriteResponse(response, responseArray, http.StatusOK)
}

// configInspectOperation extracts the response as a JSON object, verify that the user
// has access to the config based on resource control (check are done based on the configID and optional Swarm service ID)
// and either rewrite an access denied response or a decorated config.
func configInspectOperation(response *http.Response, executor *operationExecutor) error {
	// ConfigInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.30/#operation/ConfigInspect
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[configObjectIdentifier] == nil {
		return errDockerConfigIdentifierNotFound
	}

	configID := responseObject[configObjectIdentifier].(string)
	responseObject, access := applyResourceAccessControl(responseObject, configID, executor.operationContext, portainer.ConfigResourceControl)
	if !access {
		return responseutils.RewriteAccessDeniedResponse(response)
	}

	return responseutils.RewriteResponse(response, responseObject, http.StatusOK)
}

// decorateConfigList loops through all configs and decorates any config with an existing resource control.
// Resource controls checks are based on: resource identifier.
// Config object schema reference: https://docs.docker.com/engine/api/v1.30/#operation/ConfigList
func decorateConfigList(configData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedConfigData := make([]interface{}, 0)

	for _, config := range configData {

		configObject := config.(map[string]interface{})
		if configObject[configObjectIdentifier] == nil {
			return nil, errDockerConfigIdentifierNotFound
		}

		configID := configObject[configObjectIdentifier].(string)
		configObject = decorateResourceWithAccessControl(configObject, configID, resourceControls, portainer.ConfigResourceControl)

		decoratedConfigData = append(decoratedConfigData, configObject)
	}

	return decoratedConfigData, nil
}

// filterConfigList loops through all configs and filters authorized configs (access granted to the user based on existing resource control).
// Authorized configs are decorated during the process.
// Resource controls checks are based on: resource identifier.
// Config object schema reference: https://docs.docker.com/engine/api/v1.30/#operation/ConfigList
func filterConfigList(configData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredConfigData := make([]interface{}, 0)

	for _, config := range configData {
		configObject := config.(map[string]interface{})
		if configObject[configObjectIdentifier] == nil {
			return nil, errDockerConfigIdentifierNotFound
		}

		configID := configObject[configObjectIdentifier].(string)
		configObject, access := applyResourceAccessControl(configObject, configID, context, portainer.ConfigResourceControl)
		if access {
			filteredConfigData = append(filteredConfigData, configObject)
		}
	}

	return filteredConfigData, nil
}
