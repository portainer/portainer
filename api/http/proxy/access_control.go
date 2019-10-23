package proxy

import (
	"log"

	"github.com/portainer/portainer/api"
)

func (p *proxyTransport) createPrivateResourceControl(resourceIdentifier string, resourceType portainer.ResourceControlType, userID portainer.UserID) (*portainer.ResourceControl, error) {
	resourceControl, err := portainer.NewPrivateResourceControl(resourceIdentifier, resourceType, userID)
	if err != nil {
		log.Printf("[ERROR] [http,proxy,docker,transport] [message: unable to generate resource control] [err: %s]", err)
		return nil, err
	}

	err = p.ResourceControlService.CreateResourceControl(resourceControl)
	if err != nil {
		log.Printf("[ERROR] [http,proxy,docker,transport] [message: unable to persist resource control] [err: %s]", err)
		return nil, err
	}

	return resourceControl, nil
}

// applyResourceAccessControlFromLabel returns an optionally decorated object as the first return value and the
// access level for the user (granted or denied) as the second return value.
// It will retrieve an identifier from the labels object. If an identifier exists, it will check for
// an existing resource control associated to it.
// Returns a decorated object and authorized access (true) when a resource control is found and the user can access the resource.
// Returns the original object and denied access (false) when no resource control is found.
// Returns the original object and denied access (false) when a resource control is found and the user cannot access the resource.
func applyResourceAccessControlFromLabel(labelsObject, resourceObject map[string]interface{}, labelIdentifier string,
	context *restrictedDockerOperationContext, resourceType portainer.ResourceControlType) (map[string]interface{}, bool) {

	if labelsObject != nil && labelsObject[labelIdentifier] != nil {
		resourceIdentifier := labelsObject[labelIdentifier].(string)
		return applyResourceAccessControl(resourceObject, resourceIdentifier, context, resourceType)
	}
	return resourceObject, false
}

// applyResourceAccessControl returns an optionally decorated object as the first return value and the
// access level for the user (granted or denied) as the second return value.
// Returns a decorated object and authorized access (true) when a resource control is found to the specified resource
// identifier and the user can access the resource.
// Returns the original object and authorized access (false) when no resource control is found for the specified
// resource identifier.
// Returns the original object and denied access (false) when a resource control is associated to the resource
// and the user cannot access the resource.
func applyResourceAccessControl(resourceObject map[string]interface{}, resourceIdentifier string,
	context *restrictedDockerOperationContext, resourceType portainer.ResourceControlType) (map[string]interface{}, bool) {

	resourceControl := portainer.GetResourceControlByResourceIDAndType(resourceIdentifier, resourceType, context.resourceControls)
	if resourceControl == nil {
		return resourceObject, context.isAdmin || context.endpointResourceAccess
	}

	if context.isAdmin || context.endpointResourceAccess || resourceControl.Public || portainer.UserCanAccessResource(context.userID, context.userTeamIDs, resourceControl) {
		resourceObject = decorateObject(resourceObject, resourceControl)
		return resourceObject, true
	}

	return resourceObject, false
}

// decorateResourceWithAccessControlFromLabel will retrieve an identifier from the labels object. If an identifier exists,
// it will check for an existing resource control associated to it. If a resource control is found, the resource object will be
// decorated. If no identifier can be found in the labels or no resource control is associated to the identifier, the resource
// object will not be changed.
func decorateResourceWithAccessControlFromLabel(labelsObject, resourceObject map[string]interface{}, labelIdentifier string,
	resourceControls []portainer.ResourceControl, resourceType portainer.ResourceControlType) map[string]interface{} {

	if labelsObject != nil && labelsObject[labelIdentifier] != nil {
		resourceIdentifier := labelsObject[labelIdentifier].(string)
		resourceObject = decorateResourceWithAccessControl(resourceObject, resourceIdentifier, resourceControls, resourceType)
	}

	return resourceObject
}

// decorateResourceWithAccessControl will check if a resource control is associated to the specified resource identifier and type.
// If a resource control is found, the resource object will be decorated, otherwise it will not be changed.
func decorateResourceWithAccessControl(resourceObject map[string]interface{}, resourceIdentifier string,
	resourceControls []portainer.ResourceControl, resourceType portainer.ResourceControlType) map[string]interface{} {

	resourceControl := portainer.GetResourceControlByResourceIDAndType(resourceIdentifier, resourceType, resourceControls)
	if resourceControl != nil {
		return decorateObject(resourceObject, resourceControl)
	}
	return resourceObject
}

func decorateObject(object map[string]interface{}, resourceControl *portainer.ResourceControl) map[string]interface{} {
	if object["Portainer"] == nil {
		object["Portainer"] = make(map[string]interface{})
	}

	portainerMetadata := object["Portainer"].(map[string]interface{})
	portainerMetadata["ResourceControl"] = resourceControl
	return object
}
