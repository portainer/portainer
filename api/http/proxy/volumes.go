package proxy

import (
	"net/http"

	"github.com/portainer/portainer/api"
)

const (
	// ErrDockerVolumeIdentifierNotFound defines an error raised when Portainer is unable to find a volume identifier
	ErrDockerVolumeIdentifierNotFound = portainer.Error("Docker volume identifier not found")
	volumeIdentifier                  = "Name"
	volumeLabelForStackIdentifier     = "com.docker.stack.namespace"
)

// volumeListOperation extracts the response as a JSON object, loop through the volume array
// decorate and/or filter the volumes based on resource controls before rewriting the response
func volumeListOperation(response *http.Response, executor *operationExecutor) error {
	var err error
	// VolumeList response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
	responseObject, err := getResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	// The "Volumes" field contains the list of volumes as an array of JSON objects
	// Response schema reference: https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
	if responseObject["Volumes"] != nil {
		volumeData := responseObject["Volumes"].([]interface{})

		if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess {
			volumeData, err = decorateVolumeList(volumeData, executor.operationContext.resourceControls)
		} else {
			volumeData, err = filterVolumeList(volumeData, executor.operationContext)
		}
		if err != nil {
			return err
		}

		// Overwrite the original volume list
		responseObject["Volumes"] = volumeData
	}

	return rewriteResponse(response, responseObject, http.StatusOK)
}

// volumeInspectOperation extracts the response as a JSON object, verify that the user
// has access to the volume based on any existing resource control and either rewrite an access denied response
// or a decorated volume.
func volumeInspectOperation(response *http.Response, executor *operationExecutor) error {
	// VolumeInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/VolumeInspect
	responseObject, err := getResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[volumeIdentifier] == nil {
		return ErrDockerVolumeIdentifierNotFound
	}

	volumeID := responseObject[volumeIdentifier].(string)
	responseObject, access := applyResourceAccessControl(responseObject, volumeID, executor.operationContext)
	if access {
		return rewriteResponse(response, responseObject, http.StatusOK)
	}

	volumeLabels := extractVolumeLabelsFromVolumeInspectObject(responseObject)
	responseObject, access = applyResourceAccessControlFromLabel(volumeLabels, responseObject, volumeLabelForStackIdentifier, executor.operationContext)
	if access {
		return rewriteResponse(response, responseObject, http.StatusOK)
	}

	return rewriteAccessDeniedResponse(response)
}

// extractVolumeLabelsFromVolumeInspectObject retrieve the Labels of the volume if present.
// Volume schema reference: https://docs.docker.com/engine/api/v1.28/#operation/VolumeInspect
func extractVolumeLabelsFromVolumeInspectObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Labels
	return extractJSONField(responseObject, "Labels")
}

// extractVolumeLabelsFromVolumeListObject retrieve the Labels of the volume if present.
// Volume schema reference: https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
func extractVolumeLabelsFromVolumeListObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Labels
	return extractJSONField(responseObject, "Labels")
}

// decorateVolumeList loops through all volumes and decorates any volume with an existing resource control.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Volume object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
func decorateVolumeList(volumeData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedVolumeData := make([]interface{}, 0)

	for _, volume := range volumeData {

		volumeObject := volume.(map[string]interface{})
		if volumeObject[volumeIdentifier] == nil {
			return nil, ErrDockerVolumeIdentifierNotFound
		}

		volumeID := volumeObject[volumeIdentifier].(string)
		volumeObject = decorateResourceWithAccessControl(volumeObject, volumeID, resourceControls)

		volumeLabels := extractVolumeLabelsFromVolumeListObject(volumeObject)
		volumeObject = decorateResourceWithAccessControlFromLabel(volumeLabels, volumeObject, volumeLabelForStackIdentifier, resourceControls)

		decoratedVolumeData = append(decoratedVolumeData, volumeObject)
	}

	return decoratedVolumeData, nil
}

// filterVolumeList loops through all volumes and filters public volumes (no associated resource control)
// as well as authorized volumes (access granted to the user based on existing resource control).
// Authorized volumes are decorated during the process.
// Resource controls checks are based on: resource identifier, stack identifier (from label).
// Volume object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
func filterVolumeList(volumeData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredVolumeData := make([]interface{}, 0)

	for _, volume := range volumeData {
		volumeObject := volume.(map[string]interface{})
		if volumeObject[volumeIdentifier] == nil {
			return nil, ErrDockerVolumeIdentifierNotFound
		}

		volumeID := volumeObject[volumeIdentifier].(string)
		volumeObject, access := applyResourceAccessControl(volumeObject, volumeID, context)
		if !access {
			volumeLabels := extractVolumeLabelsFromVolumeListObject(volumeObject)
			volumeObject, access = applyResourceAccessControlFromLabel(volumeLabels, volumeObject, volumeLabelForStackIdentifier, context)
		}

		if access {
			filteredVolumeData = append(filteredVolumeData, volumeObject)
		}
	}

	return filteredVolumeData, nil
}
