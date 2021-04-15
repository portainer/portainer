package docker

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/docker/docker/client"
	"github.com/pkg/errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/responseutils"
	useractivityhttp "github.com/portainer/portainer/api/http/useractivity"
	"github.com/portainer/portainer/api/http/utils"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/useractivity"
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
	responseArray, err := responseutils.GetResponseAsJSONArray(response)
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

	return responseutils.RewriteResponse(response, responseArray, http.StatusOK)
}

// secretInspectOperation extracts the response as a JSON object, verify that the user
// has access to the secret based on resource control and either rewrite an access denied response or a decorated secret.
func (transport *Transport) secretInspectOperation(response *http.Response, executor *operationExecutor) error {
	// SecretInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/SecretInspect
	responseObject, err := responseutils.GetResponseAsJSONObject(response)
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

func (transport *Transport) decorateSecretCreationOperation(request *http.Request) (*http.Response, error) {
	body, err := utils.CopyBody(request)
	if err != nil {
		return nil, err
	}

	response, err := transport.decorateGenericResourceCreationOperation(request, secretObjectIdentifier, portainer.SecretResourceControl, false)

	if err == nil && (200 <= response.StatusCode && response.StatusCode < 300) {
		transport.logCreateSecretOperation(request, body)
	}

	return response, err
}

// selectorSecretLabels retrieve the labels object associated to the secret object.
// Labels are available under the "Spec.Labels" property.
// API schema references:
// https://docs.docker.com/engine/api/v1.37/#operation/SecretList
// https://docs.docker.com/engine/api/v1.37/#operation/SecretInspect
func selectorSecretLabels(responseObject map[string]interface{}) map[string]interface{} {
	secretSpec := responseutils.GetJSONObject(responseObject, "Spec")
	if secretSpec != nil {
		secretLabelsObject := responseutils.GetJSONObject(secretSpec, "Labels")
		return secretLabelsObject
	}
	return nil
}

func (transport *Transport) logCreateSecretOperation(request *http.Request, body []byte) {
	cleanBody, err := hideSecretInfo(body)
	if err != nil {
		log.Printf("[ERROR] [http,docker,secrets] [message: failed cleaning request body] [error: %s]", err)
		return
	}

	useractivityhttp.LogHttpActivity(transport.userActivityStore, transport.endpoint.Name, request, cleanBody)
}

// hideSecretInfo removes the confidential properties from the secret payload and returns the new payload
// it will read the request body and recreate it
func hideSecretInfo(body []byte) (interface{}, error) {
	type createSecretRequestPayload struct {
		Data   string
		Labels interface{}
		Name   string
	}

	var payload createSecretRequestPayload
	err := json.Unmarshal(body, &payload)
	if err != nil {
		return nil, errors.Wrap(err, "failed parsing body")
	}

	payload.Data = useractivity.RedactedValue

	return payload, nil
}
