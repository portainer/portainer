package proxy

import "github.com/portainer/portainer"

func getResourceControlByResourceID(resourceID string, resourceControls []portainer.ResourceControl) *portainer.ResourceControl {
	for _, resourceControl := range resourceControls {
		if resourceID == resourceControl.ResourceID {
			return &resourceControl
		}
		for _, subResourceID := range resourceControl.SubResourceIDs {
			if resourceID == subResourceID {
				return &resourceControl
			}
		}
	}
	return nil
}
