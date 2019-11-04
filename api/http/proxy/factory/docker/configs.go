package docker

import (
	"context"
	"errors"
	"net/http"

	"github.com/docker/docker/client"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/responseutils"
)

const (
	configObjectIdentifier = "ID"
)

func getInheritedResourceControlFromConfigLabels(dockerClient *client.Client, configID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	config, _, err := dockerClient.ConfigInspectWithRaw(context.Background(), configID)
	if err != nil {
		return nil, err
	}

	swarmStackName := config.Spec.Labels[resourceLabelForDockerSwarmStackName]
	if swarmStackName != "" {
		return portainer.GetResourceControlByResourceIDAndType(swarmStackName, portainer.StackResourceControl, resourceControls), nil
	}

	return nil, nil
}

// configListOperation extracts the response as a JSON object, loop through the configs array
// decorate and/or filter the configs based on resource controls before rewriting the response
func (transport *Transport) configListOperation(response *http.Response, executor *operationExecutor) error {
	var err error

	// ConfigList response is a JSON array
	// https://docs.docker.com/engine/api/v1.30/#operation/ConfigList
	responseArray, err := responseutils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess {
		responseArray, err = transport.decorateConfigList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = transport.filterConfigList(responseArray, executor.operationContext)
	}
	if err != nil {
		return err
	}

	return responseutils.RewriteResponse(response, responseArray, http.StatusOK)
}

// configInspectOperation extracts the response as a JSON object, verify that the user
// has access to the config based on resource control (check are done based on the configID and optional Swarm service ID)
// and either rewrite an access denied response or a decorated config.
func (transport *Transport) configInspectOperation(response *http.Response, executor *operationExecutor) error {
	// ConfigInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.30/#operation/ConfigInspect
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[configObjectIdentifier] == nil {
		return errors.New("docker secret identifier not found")
	}

	resourceControl, err := transport.findConfigResourceControl(responseObject, executor.operationContext.resourceControls)
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

func (transport *Transport) findConfigResourceControl(responseObject map[string]interface{}, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	configID := responseObject[configObjectIdentifier].(string)

	resourceControl := portainer.GetResourceControlByResourceIDAndType(configID, portainer.ConfigResourceControl, resourceControls)
	if resourceControl != nil {
		return resourceControl, nil
	}

	secretLabels := selectorConfigLabels(responseObject)
	if secretLabels != nil {
		if secretLabels[resourceLabelForDockerSwarmStackName] != nil {
			inheritedSwarmStackIdentifier := secretLabels[resourceLabelForDockerSwarmStackName].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedSwarmStackIdentifier, portainer.StackResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl, nil
			}
		}

		return transport.newResourceControlFromPortainerLabels(secretLabels, configID, portainer.ConfigResourceControl)
	}

	return nil, nil
}

// selectorConfigLabels retrieve the Labels of the config if present.
// Secret schema references:
// https://docs.docker.com/engine/api/v1.40/#operation/ConfigList
// https://docs.docker.com/engine/api/v1.40/#operation/ConfigInspect
func selectorConfigLabels(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Spec.Labels
	secretSpec := responseutils.GetJSONObject(responseObject, "Spec")
	if secretSpec != nil {
		secretLabelsObject := responseutils.GetJSONObject(secretSpec, "Labels")
		return secretLabelsObject
	}
	return nil
}

// decorateConfigList loops through all configs and decorates any config with an existing resource control.
// Resource controls checks are based on: resource identifier.
// Config object schema reference: https://docs.docker.com/engine/api/v1.30/#operation/ConfigList
func (transport *Transport) decorateConfigList(configData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedConfigData := make([]interface{}, 0)

	for _, config := range configData {

		configObject := config.(map[string]interface{})
		if configObject[configObjectIdentifier] == nil {
			return nil, errors.New("docker config identifier not found")
		}

		resourceControl, err := transport.findSecretResourceControl(configObject, resourceControls)
		if err != nil {
			return nil, err
		}

		if resourceControl != nil {
			configObject = decorateObject(configObject, resourceControl)
		}

		decoratedConfigData = append(decoratedConfigData, configObject)
	}

	return decoratedConfigData, nil
}

// filterConfigList loops through all configs and filters authorized configs (access granted to the user based on existing resource control).
// Authorized configs are decorated during the process.
// Resource controls checks are based on: resource identifier.
// Config object schema reference: https://docs.docker.com/engine/api/v1.30/#operation/ConfigList
func (transport *Transport) filterConfigList(configData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredConfigData := make([]interface{}, 0)

	for _, config := range configData {
		configObject := config.(map[string]interface{})
		if configObject[configObjectIdentifier] == nil {
			return nil, errors.New("docker config identifier not found")
		}

		resourceControl, err := transport.findSecretResourceControl(configObject, context.resourceControls)
		if err != nil {
			return nil, err
		}

		if resourceControl == nil {
			if context.isAdmin || context.endpointResourceAccess {
				filteredConfigData = append(filteredConfigData, configObject)
			}
			continue
		}

		if context.isAdmin || context.endpointResourceAccess || portainer.UserCanAccessResource(context.userID, context.userTeamIDs, resourceControl) {
			configObject = decorateObject(configObject, resourceControl)
			filteredConfigData = append(filteredConfigData, configObject)
		}
	}

	return filteredConfigData, nil
}
