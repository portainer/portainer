package proxy

import "github.com/portainer/portainer"

func getResourceControlByResourceID(resourceID string, resourceControls []portainer.ResourceControl) *portainer.ResourceControl {
	for _, resourceControl := range resourceControls {
		if resourceID == resourceControl.ResourceID {
			return &resourceControl
		}
	}
	return nil
}
