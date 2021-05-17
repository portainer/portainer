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
	secretObjectIdentifier = "ID"
)

func getInheritedResourceControlFromSecretLabels(dockerClient *client.Client, endpointID portainer.EndpointID, secretID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	secret, _, err := dockerClient.SecretInspectWithRaw(context.Background(), secretID)
	if err != nil {
		return nil, err
	}

	stackResourceID := getStackResourceIDFromLabels(secret.Spec.Labels, endpointID)
	if stackResourceID != "" {
		return authorization.GetResourceControlByResourceIDAndType(stackResourceID, portainer.StackResourceControl, resourceControls), nil
	}

	return nil, nil
}

// secretListOperation extracts the response as a JSON object, loop through the secrets array
// decorate and/or filter the secrets based on resource controls before rewriting the response.
func (transport *Transport) secretListOperation(response *http.Response, executor *operationExecutor) error {
	// SecretList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/SecretList
	responseArray, err := utils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: secretObjectIdentifier,
		resourceType:                portainer.SecretResourceControl,
		labelsObjectSelector:        selectorSecretLabels,
	}

	responseArray, err = transport.applyAccessControlOnResourceList(resourceOperationParameters, responseArray, executor)
	if err != nil {
		return err
	}

	return utils.RewriteResponse(response, responseArray, http.StatusOK)
}

// secretInspectOperation extracts the response as a JSON object, verify that the user
// has access to the secret based on resource control and either rewrite an access denied response or a decorated secret.
func (transport *Transport) secretInspectOperation(response *http.Response, executor *operationExecutor) error {
	// SecretInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/SecretInspect
	responseObject, err := utils.GetResponseAsJSONObject(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: secretObjectIdentifier,
		resourceType:                portainer.SecretResourceControl,
		labelsObjectSelector:        selectorSecretLabels,
	}

	return transport.applyAccessControlOnResource(resourceOperationParameters, responseObject, response, executor)
}

// selectorSecretLabels retrieve the labels object associated to the secret object.
// Labels are available under the "Spec.Labels" property.
// API schema references:
// https://docs.docker.com/engine/api/v1.37/#operation/SecretList
// https://docs.docker.com/engine/api/v1.37/#operation/SecretInspect
func selectorSecretLabels(responseObject map[string]interface{}) map[string]interface{} {
	secretSpec := utils.GetJSONObject(responseObject, "Spec")
	if secretSpec != nil {
		secretLabelsObject := utils.GetJSONObject(secretSpec, "Labels")
		return secretLabelsObject
	}
	return nil
}
