package docker

import (
	"context"
	"net/http"

	"github.com/docker/docker/client"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/utils"
	"github.com/portainer/portainer/api/internal/authorization"
)

const (
	configObjectIdentifier = "ID"
)

func getInheritedResourceControlFromConfigLabels(dockerClient *client.Client, endpointID portainer.EndpointID, configID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	config, _, err := dockerClient.ConfigInspectWithRaw(context.Background(), configID)
	if err != nil {
		return nil, err
	}

	stackResourceID := getStackResourceIDFromLabels(config.Spec.Labels, endpointID)
	if stackResourceID != "" {
		return authorization.GetResourceControlByResourceIDAndType(stackResourceID, portainer.StackResourceControl, resourceControls), nil
	}

	return nil, nil
}

// configListOperation extracts the response as a JSON object, loop through the configs array
// decorate and/or filter the configs based on resource controls before rewriting the response.
func (transport *Transport) configListOperation(response *http.Response, executor *operationExecutor) error {
	// ConfigList response is a JSON array
	// https://docs.docker.com/engine/api/v1.30/#operation/ConfigList
	responseArray, err := utils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: configObjectIdentifier,
		resourceType:                portainer.ConfigResourceControl,
		labelsObjectSelector:        selectorConfigLabels,
	}

	responseArray, err = transport.applyAccessControlOnResourceList(resourceOperationParameters, responseArray, executor)
	if err != nil {
		return err
	}

	return utils.RewriteResponse(response, responseArray, http.StatusOK)
}

// configInspectOperation extracts the response as a JSON object, verify that the user
// has access to the config based on resource control and either rewrite an access denied response or a decorated config.
func (transport *Transport) configInspectOperation(response *http.Response, executor *operationExecutor) error {
	// ConfigInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.30/#operation/ConfigInspect
	responseObject, err := utils.GetResponseAsJSONObject(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: configObjectIdentifier,
		resourceType:                portainer.ConfigResourceControl,
		labelsObjectSelector:        selectorConfigLabels,
	}

	return transport.applyAccessControlOnResource(resourceOperationParameters, responseObject, response, executor)
}

// selectorConfigLabels retrieve the labels object associated to the config object.
// Labels are available under the "Spec.Labels" property.
// API schema references:
// https://docs.docker.com/engine/api/v1.37/#operation/ConfigList
// https://docs.docker.com/engine/api/v1.37/#operation/ConfigInspect
func selectorConfigLabels(responseObject map[string]interface{}) map[string]interface{} {
	secretSpec := utils.GetJSONObject(responseObject, "Spec")
	if secretSpec != nil {
		secretLabelsObject := utils.GetJSONObject(secretSpec, "Labels")
		return secretLabelsObject
	}
	return nil
}
