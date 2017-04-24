package proxy

import "github.com/portainer/portainer"

// filterVolumeList loops through all volumes, filters volumes without any resource control (public resources) or with
// any resource control giving access to the user (these volumes will be decorated).
// Volume object format reference: https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
func filterVolumeList(volumeData []interface{}, resourceControls []portainer.ResourceControl, userID portainer.UserID, userTeamIDs []portainer.TeamID) ([]interface{}, error) {
	filteredVolumeData := make([]interface{}, 0)

	for _, volume := range volumeData {
		volumeObject := volume.(map[string]interface{})
		if volumeObject[volumeIdentifier] == nil {
			return nil, ErrDockerVolumeIdentifierNotFound
		}

		volumeID := volumeObject[volumeIdentifier].(string)
		volumeResourceControl := getResourceControlByResourceID(volumeID, resourceControls)
		if volumeResourceControl == nil {
			filteredVolumeData = append(filteredVolumeData, volumeObject)
		} else if volumeResourceControl != nil && canUserAccessResource(userID, userTeamIDs, volumeResourceControl) {
			volumeObject = decorateObject(volumeObject, volumeResourceControl)
			filteredVolumeData = append(filteredVolumeData, volumeObject)
		}
	}

	return filteredVolumeData, nil
}
