package proxy

import (
	"net/http"
	"path"

	"github.com/portainer/portainer"
)

const (
	// ErrDockerVolumeIdentifierNotFound defines an error raised when Portainer is unable to find a volume identifier
	ErrDockerVolumeIdentifierNotFound = portainer.Error("Docker volume identifier not found")
	volumeIdentifier                  = "Name"
)

func proxyAdministratorVolumeRequests(request *http.Request, response *http.Response, resourceControls []portainer.ResourceControl) error {
	requestPath := request.URL.Path
	if requestPath == "/volumes" {
		return decorateVolumeListResponse(response, resourceControls)
	}
	if request.Method == http.MethodGet {
		return decorateVolumeInspect(response, resourceControls)
	}
	// Decorate VolumeInspect here
	return nil
}

func proxyUserVolumeRequests(request *http.Request, response *http.Response, userID portainer.UserID, userTeamIDs []portainer.TeamID, resourceControls []portainer.ResourceControl) error {
	switch requestPath := request.URL.Path; requestPath {
	case "/volumes/create":
		return nil
	case "/volumes/prune":
		return writeAccessDeniedResponse(response)
	case "/volumes":
		return filterVolumeListResponse(response, userID, userTeamIDs, resourceControls)
	default:
		// assume /volumes/{name}
		if request.Method == http.MethodGet {
			return decorateVolumeInspectResponse(response, userID, userTeamIDs, resourceControls)
		}
		volumeID := path.Base(requestPath)
		if !isResourceAccessAuthorized(userID, userTeamIDs, volumeID, resourceControls) {
			return writeAccessDeniedResponse(response)
		}
	}

	// requestPath := request.URL.Path
	// if requestPath == "/volumes/prune" {
	// 	return writeAccessDeniedResponse(response)
	// }
	//
	// if requestPath == "/volumes/create" {
	// 	return nil
	// }
	//
	// if requestPath == "/volumes" {
	// 	return filterVolumeListResponse(response, userID, userTeamIDs, resourceControls)
	// }
	//
	// // volume requests matching /volumes/{name}
	// if match, _ := path.Match("/volumes/*", requestPath); match {
	// 	resourceID := path.Base(requestPath)
	// 	if !isResourceAccessAuthorized(userID, userTeamIDs, resourceID, resourceControls) {
	// 		return writeAccessDeniedResponse(response)
	// 	}
	// }

	return nil
}

func decorateVolumeInspect(response *http.Response, resourceControls []portainer.ResourceControl) error {
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

	volumeResourceControl := getResourceControlByResourceID(volumeID, resourceControls)
	if volumeResourceControl != nil {
		responseObject = decorateObject(responseObject, volumeResourceControl)
	}

	return rewriteResponse(response, responseObject, http.StatusOK)
}

func decorateVolumeInspectResponse(response *http.Response, userID portainer.UserID, userTeamIDs []portainer.TeamID, resourceControls []portainer.ResourceControl) error {
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

	volumeResourceControl := getResourceControlByResourceID(volumeID, resourceControls)
	if volumeResourceControl != nil && canUserAccessResource(userID, userTeamIDs, volumeResourceControl) {
		responseObject = decorateObject(responseObject, volumeResourceControl)
		return rewriteResponse(response, responseObject, http.StatusOK)
	}

	return nil
}

// The "Volumes" field contains the list of volumes as an array of JSON objects
// Response schema reference: https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
func extractVolumeDataFromResponse(responseObject map[string]interface{}) ([]interface{}, error) {
	if responseObject["Volumes"] == nil {
		return nil, portainer.ErrUnsupportedDockerAPI
	}

	volumeData := responseObject["Volumes"].([]interface{})
	return volumeData, nil
}

// decorateVolumeListResponse will parse the response as a generic JSON object,
// filter volumes based on resource controls, decorate filtered volumes and rewrite it as the new response content.
func filterVolumeListResponse(response *http.Response, userID portainer.UserID, userTeamIDs []portainer.TeamID, resourceControls []portainer.ResourceControl) error {
	// VolumeList response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
	responseObject, err := getResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	volumeData, err := extractVolumeDataFromResponse(responseObject)
	if err != nil {
		return err
	}

	filteredVolumeData, err := filterVolumeList(volumeData, resourceControls, userID, userTeamIDs)
	if err != nil {
		return err
	}

	// Overwrite the original volume list
	responseObject["Volumes"] = filteredVolumeData

	return rewriteResponse(response, responseObject, http.StatusOK)
}

// decorateVolumeListResponse will parse the response as a generic JSON object,
// decorate it and rewrite it as the new response content.
func decorateVolumeListResponse(response *http.Response, resourceControls []portainer.ResourceControl) error {
	// VolumeList response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
	responseObject, err := getResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	volumeData, err := extractVolumeDataFromResponse(responseObject)
	if err != nil {
		return err
	}

	decoratedVolumeData, err := decorateVolumeList(volumeData, resourceControls)
	if err != nil {
		return err
	}

	// Overwrite the original volume list
	responseObject["Volumes"] = decoratedVolumeData

	return rewriteResponse(response, responseObject, http.StatusOK)
}
