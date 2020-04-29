package docker

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/docker/docker/client"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/responseutils"
)

const (
	volumeObjectIdentifier = "Name"
)

func getInheritedResourceControlFromVolumeLabels(dockerClient *client.Client, volumeID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	volume, err := dockerClient.VolumeInspect(context.Background(), volumeID)
	if err != nil {
		return nil, err
	}

	swarmStackName := volume.Labels[resourceLabelForDockerSwarmStackName]
	if swarmStackName != "" {
		return portainer.GetResourceControlByResourceIDAndType(swarmStackName, portainer.StackResourceControl, resourceControls), nil
	}

	return nil, nil
}

// volumeListOperation extracts the response as a JSON object, loop through the volume array
// decorate and/or filter the volumes based on resource controls before rewriting the response.
func (transport *Transport) volumeListOperation(response *http.Response, executor *operationExecutor) error {
	// VolumeList response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	// The "Volumes" field contains the list of volumes as an array of JSON objects
	if responseObject["Volumes"] != nil {
		volumeData := responseObject["Volumes"].([]interface{})

		resourceOperationParameters := &resourceOperationParameters{
			resourceIdentifierAttribute: volumeObjectIdentifier,
			resourceType:                portainer.VolumeResourceControl,
			labelsObjectSelector:        selectorVolumeLabels,
		}

		volumeData, err = transport.applyAccessControlOnResourceList(resourceOperationParameters, volumeData, executor)
		if err != nil {
			return err
		}

		// Overwrite the original volume list
		responseObject["Volumes"] = volumeData
	}

	return responseutils.RewriteResponse(response, responseObject, http.StatusOK)
}

// volumeInspectOperation extracts the response as a JSON object, verify that the user
// has access to the volume based on any existing resource control and either rewrite an access denied response or a decorated volume.
func (transport *Transport) volumeInspectOperation(response *http.Response, executor *operationExecutor) error {
	// VolumeInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/VolumeInspect
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: volumeObjectIdentifier,
		resourceType:                portainer.VolumeResourceControl,
		labelsObjectSelector:        selectorVolumeLabels,
	}

	return transport.applyAccessControlOnResource(resourceOperationParameters, responseObject, response, executor)
}

func (transport *Transport) volumeCreationOperation(request *http.Request, resourceIdentifierAttribute string, resourceType portainer.ResourceControlType) (*http.Response, error) {
	var dataObject map[string]interface{}
	if request.Body != nil {
		var data interface{}

		body, err := ioutil.ReadAll(request.Body)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(body, &data)
		if err != nil {
			return nil, err
		}

		dataObject = data.(map[string]interface{})
		request.Body = ioutil.NopCloser(bytes.NewBuffer(body))
		fmt.Println(dataObject)
	}

	resourceControls, err := transport.resourceControlService.ResourceControls()
	if err != nil {
		fmt.Println(err)
	}

	for _, rc := range resourceControls {
		if rc.ResourceID == dataObject[resourceIdentifierAttribute] {
			return nil, errors.New("Volume already exists")
		}
	}

	return transport.decorateGenericResourceCreationOperation(request, resourceIdentifierAttribute, resourceType)
}

// selectorVolumeLabels retrieve the labels object associated to the volume object.
// Labels are available under the "Labels" property.
// API schema references:
// https://docs.docker.com/engine/api/v1.28/#operation/VolumeInspect
// https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
func selectorVolumeLabels(responseObject map[string]interface{}) map[string]interface{} {
	return responseutils.GetJSONObject(responseObject, "Labels")
}
