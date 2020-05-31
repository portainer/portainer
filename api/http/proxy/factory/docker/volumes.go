package docker

import (
	"context"
	"errors"
	"log"
	"net/http"
	"path"

	"github.com/docker/docker/client"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/responseutils"
	"github.com/portainer/portainer/api/http/security"
)

const (
	volumeObjectIdentifier = "ID"
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

		for _, volumeObject := range volumeData {
			volume := volumeObject.(map[string]interface{})
			volume[volumeObjectIdentifier] = volume["Name"].(string) + volume["CreatedAt"].(string)
		}

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
	responseObject[volumeObjectIdentifier] = responseObject["Name"].(string) + responseObject["CreatedAt"].(string)

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: volumeObjectIdentifier,
		resourceType:                portainer.VolumeResourceControl,
		labelsObjectSelector:        selectorVolumeLabels,
	}

	return transport.applyAccessControlOnResource(resourceOperationParameters, responseObject, response, executor)
}

// selectorVolumeLabels retrieve the labels object associated to the volume object.
// Labels are available under the "Labels" property.
// API schema references:
// https://docs.docker.com/engine/api/v1.28/#operation/VolumeInspect
// https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
func selectorVolumeLabels(responseObject map[string]interface{}) map[string]interface{} {
	return responseutils.GetJSONObject(responseObject, "Labels")
}

func (transport *Transport) decorateVolumeResourceCreationOperation(request *http.Request, resourceIdentifierAttribute string, resourceType portainer.ResourceControlType) (*http.Response, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	volumeID := request.Header.Get("X-Portainer-VolumeName")

	if volumeID != "" {
		cli := transport.dockerClient
		agentTargetHeader := request.Header.Get(portainer.PortainerAgentTargetHeader)
		if agentTargetHeader != "" {
			dockerClient, err := transport.dockerClientFactory.CreateClient(transport.endpoint, agentTargetHeader)
			if err != nil {
				return nil, err
			}
			defer dockerClient.Close()
			cli = dockerClient
		}

		_, err = cli.VolumeInspect(context.Background(), volumeID)
		if err == nil {
			return nil, errors.New("a volume with the same name already exists")
		}
	}

	response, err := transport.executeDockerRequest(request)
	if err != nil {
		return response, err
	}

	if response.StatusCode == http.StatusCreated {
		err = transport.decorateVolumeCreationResponse(response, resourceIdentifierAttribute, resourceType, tokenData.ID)
	}
	return response, err
}

func (transport *Transport) decorateVolumeCreationResponse(response *http.Response, resourceIdentifierAttribute string, resourceType portainer.ResourceControlType, userID portainer.UserID) error {
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject["Name"] == nil {
		log.Printf("[ERROR] [proxy,docker]")
		return errors.New("missing identifier in Docker resource creation response")
	}

	resourceID := responseObject["Name"].(string) + responseObject["CreatedAt"].(string)

	resourceControl, err := transport.createPrivateResourceControl(resourceID, resourceType, userID)
	if err != nil {
		return err
	}

	responseObject = decorateObject(responseObject, resourceControl)

	return responseutils.RewriteResponse(response, responseObject, http.StatusOK)
}

func (transport *Transport) volumeDetailOperation(requestPath string, request *http.Request) (*http.Response, error) {

	if request.Method == http.MethodGet {
		return transport.rewriteOperation(request, transport.volumeInspectOperation)
	}

	cli := transport.dockerClient
	volume, err := cli.VolumeInspect(context.Background(), path.Base(requestPath))
	if err != nil {
		return nil, err
	}

	volumeID := volume.Name + volume.CreatedAt

	if request.Method == http.MethodDelete {
		return transport.executeGenericResourceDeletionOperation(request, volumeID, portainer.VolumeResourceControl)
	}
	return transport.restrictedResourceOperation(request, volumeID, portainer.VolumeResourceControl, false)
}
