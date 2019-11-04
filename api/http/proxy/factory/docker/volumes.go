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
// decorate and/or filter the volumes based on resource controls before rewriting the response
func (transport *Transport) volumeListOperation(response *http.Response, executor *operationExecutor) error {
	var err error
	// VolumeList response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	// The "Volumes" field contains the list of volumes as an array of JSON objects
	// Response schema reference: https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
	if responseObject["Volumes"] != nil {
		volumeData := responseObject["Volumes"].([]interface{})

		if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess {
			volumeData, err = transport.decorateVolumeList(volumeData, executor.operationContext.resourceControls)
		} else {
			volumeData, err = transport.filterVolumeList(volumeData, executor.operationContext)
		}
		if err != nil {
			return err
		}

		// Overwrite the original volume list
		responseObject["Volumes"] = volumeData
	}

	return responseutils.RewriteResponse(response, responseObject, http.StatusOK)
}

// volumeInspectOperation extracts the response as a JSON object, verify that the user
// has access to the volume based on any existing resource control and either rewrite an access denied response
// or a decorated volume.
func (transport *Transport) volumeInspectOperation(response *http.Response, executor *operationExecutor) error {
	// VolumeInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/VolumeInspect
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[volumeObjectIdentifier] == nil {
		return errors.New("docker volume identifier not found")
	}

	resourceControl, err := transport.findVolumeResourceControl(responseObject, executor.operationContext.resourceControls)
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

// findVolumeResourceControl will search for a resource control object associated to the service or
// inherited from a Swarm stack (based on labels).
func (transport *Transport) findVolumeResourceControl(responseObject map[string]interface{}, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	volumeID := responseObject[volumeObjectIdentifier].(string)

	resourceControl := portainer.GetResourceControlByResourceIDAndType(volumeID, portainer.VolumeResourceControl, resourceControls)
	if resourceControl != nil {
		return resourceControl, nil
	}

	volumeLabels := selectorVolumeLabels(responseObject)
	if volumeLabels != nil {
		if volumeLabels[resourceLabelForDockerSwarmStackName] != nil {
			inheritedSwarmStackIdentifier := volumeLabels[resourceLabelForDockerSwarmStackName].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedSwarmStackIdentifier, portainer.StackResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl, nil
			}
		}

		return transport.newResourceControlFromPortainerLabels(volumeLabels, volumeID, portainer.VolumeResourceControl)
	}

	return nil, nil
}

// selectorVolumeLabels retrieve the Labels of the volume if present.
// Volume schema references:
// https://docs.docker.com/engine/api/v1.28/#operation/VolumeInspect
// https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
func selectorVolumeLabels(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Labels
	return responseutils.GetJSONObject(responseObject, "Labels")
}

// decorateVolumeList loops through all volumes and decorates any volume with an existing resource control.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Volume object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
func (transport *Transport) decorateVolumeList(volumeData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedVolumeData := make([]interface{}, 0)

	for _, volume := range volumeData {

		volumeObject := volume.(map[string]interface{})
		if volumeObject[volumeObjectIdentifier] == nil {
			return nil, errors.New("docker volume identifier not found")
		}

		resourceControl, err := transport.findVolumeResourceControl(volumeObject, resourceControls)
		if err != nil {
			return nil, err
		}

		if resourceControl != nil {
			volumeObject = decorateObject(volumeObject, resourceControl)
		}

		decoratedVolumeData = append(decoratedVolumeData, volumeObject)
	}

	return decoratedVolumeData, nil
}

// filterVolumeList loops through all volumes and filters authorized volumes (access granted to the user based on existing resource control).
// Authorized volumes are decorated during the process.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Volume object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
func (transport *Transport) filterVolumeList(volumeData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredVolumeData := make([]interface{}, 0)

	for _, volume := range volumeData {
		volumeObject := volume.(map[string]interface{})
		if volumeObject[volumeObjectIdentifier] == nil {
			return nil, errors.New("docker volume identifier not found")
		}

		resourceControl, err := transport.findVolumeResourceControl(volumeObject, context.resourceControls)
		if err != nil {
			return nil, err
		}

		if resourceControl == nil {
			if context.isAdmin || context.endpointResourceAccess {
				filteredVolumeData = append(filteredVolumeData, volumeObject)
			}
			continue
		}

		if context.isAdmin || context.endpointResourceAccess || portainer.UserCanAccessResource(context.userID, context.userTeamIDs, resourceControl) {
			volumeObject = decorateObject(volumeObject, resourceControl)
			filteredVolumeData = append(filteredVolumeData, volumeObject)
		}
	}

	return filteredVolumeData, nil
}
