package proxy

import "github.com/portainer/portainer"

type (
// resourceControlMetadata struct {
// 	ID    portainer.ResourceControlID `json:"Id"`
// 	AdministratorsOnly
// 	Users []portainer.UserID          `json:"Users"`
// 	Teams []portainer.TeamID          `json:"Teams"`
// }
)

// decorateVolumeList loops through all volumes and will decorate any volume with an existing resource control.
// Volume object format reference: https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
func decorateVolumeList(volumeData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedVolumeData := make([]interface{}, 0)

	for _, volume := range volumeData {

		volumeObject := volume.(map[string]interface{})
		if volumeObject[volumeIdentifier] == nil {
			return nil, ErrDockerVolumeIdentifierNotFound
		}

		volumeID := volumeObject[volumeIdentifier].(string)
		resourceControl := getResourceControlByResourceID(volumeID, resourceControls)
		if resourceControl != nil {
			volumeObject = decorateObject(volumeObject, resourceControl)
		}
		decoratedVolumeData = append(decoratedVolumeData, volumeObject)
	}

	return decoratedVolumeData, nil
}

func decorateObject(object map[string]interface{}, resourceControl *portainer.ResourceControl) map[string]interface{} {
	metadata := make(map[string]interface{})
	metadata["ResourceControl"] = resourceControl
	object["Portainer"] = metadata
	return object
}
