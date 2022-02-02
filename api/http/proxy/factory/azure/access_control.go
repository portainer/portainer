package azure

import (
	"log"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
)

func (transport *Transport) createAzureRequestContext(request *http.Request) (*azureRequestContext, error) {
	var err error

	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	resourceControls, err := transport.dataStore.ResourceControl().ResourceControls()
	if err != nil {
		return nil, err
	}

	context := &azureRequestContext{
		isAdmin:          true,
		userID:           tokenData.ID,
		resourceControls: resourceControls,
	}

	if tokenData.Role != portainer.AdministratorRole {
		context.isAdmin = false

		teamMemberships, err := transport.dataStore.TeamMembership().TeamMembershipsByUserID(tokenData.ID)
		if err != nil {
			return nil, err
		}

		userTeamIDs := make([]portainer.TeamID, 0)
		for _, membership := range teamMemberships {
			userTeamIDs = append(userTeamIDs, membership.TeamID)
		}
		context.userTeamIDs = userTeamIDs
	}

	return context, nil
}

func decorateObject(object map[string]interface{}, resourceControl *portainer.ResourceControl) map[string]interface{} {
	if object["Portainer"] == nil {
		object["Portainer"] = make(map[string]interface{})
	}

	portainerMetadata := object["Portainer"].(map[string]interface{})
	portainerMetadata["ResourceControl"] = resourceControl
	return object
}

func (transport *Transport) createPrivateResourceControl(
	resourceIdentifier string,
	resourceType portainer.ResourceControlType,
	userID portainer.UserID) (*portainer.ResourceControl, error) {

	resourceControl := authorization.NewPrivateResourceControl(resourceIdentifier, resourceType, userID)

	err := transport.dataStore.ResourceControl().Create(resourceControl)
	if err != nil {
		log.Printf("[ERROR] [http,proxy,azure,transport] [message: unable to persist resource control] [resource: %s] [err: %s]", resourceIdentifier, err)
		return nil, err
	}

	return resourceControl, nil
}

func (transport *Transport) userCanDeleteContainerGroup(request *http.Request, context *azureRequestContext) bool {
	if context.isAdmin {
		return true
	}
	resourceIdentifier := request.URL.Path
	resourceControl := transport.findResourceControl(resourceIdentifier, context)
	return authorization.UserCanAccessResource(context.userID, context.userTeamIDs, resourceControl)
}

func (transport *Transport) decorateContainerGroups(containerGroups []interface{}, context *azureRequestContext) []interface{} {
	decoratedContainerGroups := make([]interface{}, 0)

	for _, containerGroup := range containerGroups {
		containerGroup = transport.decorateContainerGroup(containerGroup.(map[string]interface{}), context)
		decoratedContainerGroups = append(decoratedContainerGroups, containerGroup)
	}

	return decoratedContainerGroups
}

func (transport *Transport) decorateContainerGroup(containerGroup map[string]interface{}, context *azureRequestContext) map[string]interface{} {
	containerGroupId, ok := containerGroup["id"].(string)
	if ok {
		resourceControl := transport.findResourceControl(containerGroupId, context)
		if resourceControl != nil {
			containerGroup = decorateObject(containerGroup, resourceControl)
		}
	} else {
		log.Printf("[WARN] [http,proxy,azure,decorate] [message: unable to find resource id property in container group]")
	}

	return containerGroup
}

func (transport *Transport) filterContainerGroups(containerGroups []interface{}, context *azureRequestContext) []interface{} {
	filteredContainerGroups := make([]interface{}, 0)

	for _, containerGroup := range containerGroups {
		userCanAccessResource := false
		containerGroup := containerGroup.(map[string]interface{})
		portainerObject, ok := containerGroup["Portainer"].(map[string]interface{})
		if ok {
			resourceControl, ok := portainerObject["ResourceControl"].(*portainer.ResourceControl)
			if ok {
				userCanAccessResource = authorization.UserCanAccessResource(context.userID, context.userTeamIDs, resourceControl)
			}
		}

		if context.isAdmin || userCanAccessResource {
			filteredContainerGroups = append(filteredContainerGroups, containerGroup)
		}
	}

	return filteredContainerGroups
}

func (transport *Transport) removeResourceControl(containerGroup map[string]interface{}, context *azureRequestContext) error {
	containerGroupID, ok := containerGroup["id"].(string)
	if ok {
		resourceControl := transport.findResourceControl(containerGroupID, context)
		if resourceControl != nil {
			err := transport.dataStore.ResourceControl().DeleteResourceControl(resourceControl.ID)
			return err
		}
	} else {
		log.Printf("[WARN] [http,proxy,azure] [message: missign ID in container group]")
	}

	return nil
}

func (transport *Transport) findResourceControl(containerGroupId string, context *azureRequestContext) *portainer.ResourceControl {
	resourceControl := authorization.GetResourceControlByResourceIDAndType(containerGroupId, portainer.ContainerGroupResourceControl, context.resourceControls)
	return resourceControl
}
