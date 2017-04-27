package proxy

import (
	"net/http"

	"github.com/portainer/portainer"
)

const (
	// ErrDockerVolumeIdentifierNotFound defines an error raised when Portainer is unable to find a volume identifier
	ErrDockerVolumeIdentifierNotFound = portainer.Error("Docker volume identifier not found")
	volumeIdentifier                  = "Name"
)

// volumeListOperation extracts the response as a JSON object, loop through the volume array
// decorate and/or filter the volumes based on resource controls before rewriting the response
func volumeListOperation(request *http.Request, response *http.Response, operationContext *restrictedOperationContext) error {
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

		if operationContext.isAdmin {
			volumeData, err = decorateVolumeList(volumeData, operationContext.resourceControls)
		} else {
			volumeData, err = filterVolumeList(volumeData, operationContext.resourceControls, operationContext.userID, operationContext.userTeamIDs)
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
// has access to the volume based on resource control and either rewrite an access denied response
// or a decorated volume.
func volumeInspectOperation(request *http.Request, response *http.Response, operationContext *restrictedOperationContext) error {
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

	volumeResourceControl := getResourceControlByResourceID(volumeID, operationContext.resourceControls)
	if volumeResourceControl != nil {
		if operationContext.isAdmin || canUserAccessResource(operationContext.userID, operationContext.userTeamIDs, volumeResourceControl) {
			responseObject = decorateObject(responseObject, volumeResourceControl)
		} else {
			return rewriteAccessDeniedResponse(response)
		}
	}

	return rewriteResponse(response, responseObject, http.StatusOK)
}
