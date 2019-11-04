package docker

import (
	"context"
	"errors"
	"net/http"

	"github.com/docker/docker/client"

	"github.com/portainer/portainer/api/http/proxy/factory/responseutils"

	"github.com/portainer/portainer/api"
)

const (
	secretObjectIdentifier = "ID"
)

func getInheritedResourceControlFromSecretLabels(dockerClient *client.Client, secretID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	secret, _, err := dockerClient.SecretInspectWithRaw(context.Background(), secretID)
	if err != nil {
		return nil, err
	}

	swarmStackName := secret.Spec.Labels[resourceLabelForDockerSwarmStackName]
	if swarmStackName != "" {
		return portainer.GetResourceControlByResourceIDAndType(swarmStackName, portainer.StackResourceControl, resourceControls), nil
	}

	return nil, nil
}

// secretListOperation extracts the response as a JSON object, loop through the secrets array
// decorate and/or filter the secrets based on resource controls before rewriting the response
func (transport *Transport) secretListOperation(response *http.Response, executor *operationExecutor) error {
	var err error

	// SecretList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/SecretList
	responseArray, err := responseutils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess {
		responseArray, err = transport.decorateSecretList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = transport.filterSecretList(responseArray, executor.operationContext)
	}
	if err != nil {
		return err
	}

	return responseutils.RewriteResponse(response, responseArray, http.StatusOK)
}

// secretInspectOperation extracts the response as a JSON object, verify that the user
// has access to the secret based on resource control (check are done based on the secretID and optional Swarm service ID)
// and either rewrite an access denied response or a decorated secret.
func (transport *Transport) secretInspectOperation(response *http.Response, executor *operationExecutor) error {
	// SecretInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/SecretInspect
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[secretObjectIdentifier] == nil {
		return errors.New("docker secret identifier not found")
	}

	resourceControl, err := transport.findSecretResourceControl(responseObject, executor.operationContext.resourceControls)
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

func (transport *Transport) findSecretResourceControl(responseObject map[string]interface{}, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	secretID := responseObject[secretObjectIdentifier].(string)

	resourceControl := portainer.GetResourceControlByResourceIDAndType(secretID, portainer.SecretResourceControl, resourceControls)
	if resourceControl != nil {
		return resourceControl, nil
	}

	secretLabels := selectorSecretLabels(responseObject)
	if secretLabels != nil {
		if secretLabels[resourceLabelForDockerSwarmStackName] != nil {
			inheritedSwarmStackIdentifier := secretLabels[resourceLabelForDockerSwarmStackName].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedSwarmStackIdentifier, portainer.StackResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl, nil
			}
		}

		return transport.newResourceControlFromPortainerLabels(secretLabels, secretID, portainer.SecretResourceControl)
	}

	return nil, nil
}

// selectorSecretLabels retrieve the Labels of the secret if present.
// Secret schema references:
// https://docs.docker.com/engine/api/v1.40/#operation/SecretList
// https://docs.docker.com/engine/api/v1.40/#operation/SecretInspect
func selectorSecretLabels(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Spec.Labels
	secretSpec := responseutils.GetJSONObject(responseObject, "Spec")
	if secretSpec != nil {
		secretLabelsObject := responseutils.GetJSONObject(secretSpec, "Labels")
		return secretLabelsObject
	}
	return nil
}

// decorateSecretList loops through all secrets and decorates any secret with an existing resource control.
// Resource controls checks are based on: resource identifier and stack identifier (from label).
// Resources controls can also be generated on the fly via specific Portainer labels.
// Secret object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/SecretList
func (transport *Transport) decorateSecretList(secretData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedSecretData := make([]interface{}, 0)

	for _, secret := range secretData {

		secretObject := secret.(map[string]interface{})
		if secretObject[secretObjectIdentifier] == nil {
			return nil, errors.New("docker secret identifier not found")
		}

		resourceControl, err := transport.findSecretResourceControl(secretObject, resourceControls)
		if err != nil {
			return nil, err
		}

		if resourceControl != nil {
			secretObject = decorateObject(secretObject, resourceControl)
		}

		decoratedSecretData = append(decoratedSecretData, secretObject)
	}

	return decoratedSecretData, nil
}

// filterSecretList loops through all secrets and filters authorized secrets (access granted to the user based on existing resource control).
// Authorized secrets are decorated during the process.
// Resource controls checks are based on: resource identifier.
// Resources controls can also be generated on the fly via specific Portainer labels
// Secret object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/SecretList
func (transport *Transport) filterSecretList(secretData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredSecretData := make([]interface{}, 0)

	for _, secret := range secretData {
		secretObject := secret.(map[string]interface{})
		if secretObject[secretObjectIdentifier] == nil {
			return nil, errors.New("docker secret identifier not found")
		}

		resourceControl, err := transport.findSecretResourceControl(secretObject, context.resourceControls)
		if err != nil {
			return nil, err
		}

		if resourceControl == nil {
			if context.isAdmin || context.endpointResourceAccess {
				filteredSecretData = append(filteredSecretData, secretObject)
			}
			continue
		}

		if context.isAdmin || context.endpointResourceAccess || portainer.UserCanAccessResource(context.userID, context.userTeamIDs, resourceControl) {
			secretObject = decorateObject(secretObject, resourceControl)
			filteredSecretData = append(filteredSecretData, secretObject)
		}
	}

	return filteredSecretData, nil
}
