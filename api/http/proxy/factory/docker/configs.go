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
	responseArray, err := responseutils.GetResponseAsJSONArray(response)
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

	return responseutils.RewriteResponse(response, responseArray, http.StatusOK)
}

// configInspectOperation extracts the response as a JSON object, verify that the user
// has access to the config based on resource control and either rewrite an access denied response or a decorated config.
func (transport *Transport) configInspectOperation(response *http.Response, executor *operationExecutor) error {
	// ConfigInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.30/#operation/ConfigInspect
	responseObject, err := responseutils.GetResponseAsJSONObject(response)
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

func (transport *Transport) decorateConfigCreationOperation(request *http.Request) (*http.Response, error) {
	body, err := utils.CopyBody(request)
	if err != nil {
		return nil, err
	}

	response, err := transport.decorateGenericResourceCreationOperation(request, configObjectIdentifier, portainer.ConfigResourceControl, false)

	if err == nil && (200 <= response.StatusCode && response.StatusCode < 300) {
		transport.logCreateConfigOperation(request, body)
	}

	return response, err
}

func (transport *Transport) logCreateConfigOperation(request *http.Request, body []byte) {
	cleanBody, err := hideConfigInfo(body)
	if err != nil {
		log.Printf("[ERROR] [http,docker,config] [message: failed cleaning request body] [error: %s]", err)
		return
	}

	useractivityhttp.LogHttpActivity(transport.userActivityStore, transport.endpoint.Name, request, cleanBody)
}

// selectorConfigLabels retrieve the labels object associated to the config object.
// Labels are available under the "Spec.Labels" property.
// API schema references:
// https://docs.docker.com/engine/api/v1.37/#operation/ConfigList
// https://docs.docker.com/engine/api/v1.37/#operation/ConfigInspect
func selectorConfigLabels(responseObject map[string]interface{}) map[string]interface{} {
	secretSpec := responseutils.GetJSONObject(responseObject, "Spec")
	if secretSpec != nil {
		secretLabelsObject := responseutils.GetJSONObject(secretSpec, "Labels")
		return secretLabelsObject
	}
	return nil
}

// hideConfigInfo removes the confidential properties from the secret payload and returns the new payload
// it will read the request body and recreate it
func hideConfigInfo(body []byte) (interface{}, error) {
	type requestPayload struct {
		Data   string
		Labels interface{}
		Name   string
	}

	var payload requestPayload
	err := json.Unmarshal(body, &payload)
	if err != nil {
		return nil, errors.Wrap(err, "failed parsing body")
	}

	payload.Data = useractivity.RedactedValue

	return payload, nil
}
