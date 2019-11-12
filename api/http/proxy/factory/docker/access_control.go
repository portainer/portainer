package docker

import (
	"log"
	"net/http"
	"strings"

	"github.com/portainer/portainer/api/http/proxy/factory/responseutils"

	"github.com/portainer/portainer/api"
)

const (
	resourceLabelForPortainerTeamResourceControl   = "io.portainer.accesscontrol.teams"
	resourceLabelForPortainerUserResourceControl   = "io.portainer.accesscontrol.users"
	resourceLabelForPortainerPublicResourceControl = "io.portainer.accesscontrol.public"
	resourceLabelForDockerSwarmStackName           = "com.docker.stack.namespace"
	resourceLabelForDockerServiceID                = "com.docker.swarm.service.id"
	resourceLabelForDockerComposeStackName         = "com.docker.compose.project"
)

type (
	resourceLabelsObjectSelector func(map[string]interface{}) map[string]interface{}
	resourceOperationParameters  struct {
		resourceIdentifierAttribute string
		resourceType                portainer.ResourceControlType
		labelsObjectSelector        resourceLabelsObjectSelector
	}
)

func (transport *Transport) newResourceControlFromPortainerLabels(labelsObject map[string]interface{}, resourceID string, resourceType portainer.ResourceControlType) (*portainer.ResourceControl, error) {
	if labelsObject[resourceLabelForPortainerPublicResourceControl] != nil {
		resourceControl := portainer.NewPublicResourceControl(resourceID, resourceType)

		err := transport.resourceControlService.CreateResourceControl(resourceControl)
		if err != nil {
			return nil, err
		}

		return resourceControl, nil
	}

	teamNames := make([]string, 0)
	userNames := make([]string, 0)
	if labelsObject[resourceLabelForPortainerTeamResourceControl] != nil {
		concatenatedTeamNames := labelsObject[resourceLabelForPortainerTeamResourceControl].(string)
		teamNames = strings.Split(concatenatedTeamNames, ",")
	}

	if labelsObject[resourceLabelForPortainerUserResourceControl] != nil {
		concatenatedUserNames := labelsObject[resourceLabelForPortainerUserResourceControl].(string)
		userNames = strings.Split(concatenatedUserNames, ",")
	}

	if len(teamNames) > 0 || len(userNames) > 0 {
		teamIDs := make([]portainer.TeamID, 0)
		userIDs := make([]portainer.UserID, 0)

		for _, name := range teamNames {
			team, err := transport.teamService.TeamByName(name)
			if err != nil {
				log.Printf("[WARN] [http,proxy,docker] [message: unknown team name in access control label, ignoring access control rule for this team] [name: %s] [resource_id: %s]", name, resourceID)
				continue
			}

			teamIDs = append(teamIDs, team.ID)
		}

		for _, name := range userNames {
			user, err := transport.userService.UserByUsername(name)
			if err != nil {
				log.Printf("[WARN] [http,proxy,docker] [message: unknown user name in access control label, ignoring access control rule for this user] [name: %s] [resource_id: %s]", name, resourceID)
				continue
			}

			userIDs = append(userIDs, user.ID)
		}

		resourceControl := portainer.NewRestrictedResourceControl(resourceID, resourceType, userIDs, teamIDs)

		err := transport.resourceControlService.CreateResourceControl(resourceControl)
		if err != nil {
			return nil, err
		}

		return resourceControl, nil
	}

	return nil, nil
}

func (transport *Transport) createPrivateResourceControl(resourceIdentifier string, resourceType portainer.ResourceControlType, userID portainer.UserID) (*portainer.ResourceControl, error) {
	resourceControl := portainer.NewPrivateResourceControl(resourceIdentifier, resourceType, userID)

	err := transport.resourceControlService.CreateResourceControl(resourceControl)
	if err != nil {
		log.Printf("[ERROR] [http,proxy,docker,transport] [message: unable to persist resource control] [resource: %s] [err: %s]", resourceIdentifier, err)
		return nil, err
	}

	return resourceControl, nil
}

func (transport *Transport) getInheritedResourceControlFromServiceOrStack(resourceIdentifier, nodeName string, resourceType portainer.ResourceControlType, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	client := transport.dockerClient

	if nodeName != "" {
		dockerClient, err := transport.dockerClientFactory.CreateClient(transport.endpoint, nodeName)
		if err != nil {
			return nil, err
		}
		defer dockerClient.Close()

		client = dockerClient
	}

	switch resourceType {
	case portainer.ContainerResourceControl:
		return getInheritedResourceControlFromContainerLabels(client, resourceIdentifier, resourceControls)
	case portainer.NetworkResourceControl:
		return getInheritedResourceControlFromNetworkLabels(client, resourceIdentifier, resourceControls)
	case portainer.VolumeResourceControl:
		return getInheritedResourceControlFromVolumeLabels(client, resourceIdentifier, resourceControls)
	case portainer.ServiceResourceControl:
		return getInheritedResourceControlFromServiceLabels(client, resourceIdentifier, resourceControls)
	case portainer.ConfigResourceControl:
		return getInheritedResourceControlFromConfigLabels(client, resourceIdentifier, resourceControls)
	case portainer.SecretResourceControl:
		return getInheritedResourceControlFromSecretLabels(client, resourceIdentifier, resourceControls)
	}

	return nil, nil
}

func (transport *Transport) applyAccessControlOnResource(parameters *resourceOperationParameters, responseObject map[string]interface{}, response *http.Response, executor *operationExecutor) error {
	if responseObject[parameters.resourceIdentifierAttribute] == nil {
		log.Printf("[WARN] [message: unable to find resource identifier property in resource object] [identifier_attribute: %s]", parameters.resourceIdentifierAttribute)
		return nil
	}

	if parameters.resourceType == portainer.NetworkResourceControl {
		systemResourceControl := findSystemNetworkResourceControl(responseObject)
		if systemResourceControl != nil {
			responseObject = decorateObject(responseObject, systemResourceControl)
			return responseutils.RewriteResponse(response, responseObject, http.StatusOK)
		}
	}

	resourceIdentifier := responseObject[parameters.resourceIdentifierAttribute].(string)
	resourceLabelsObject := parameters.labelsObjectSelector(responseObject)

	resourceControl, err := transport.findResourceControl(resourceIdentifier, parameters.resourceType, resourceLabelsObject, executor.operationContext.resourceControls)
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

func (transport *Transport) applyAccessControlOnResourceList(parameters *resourceOperationParameters, resourceData []interface{}, executor *operationExecutor) ([]interface{}, error) {
	if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess {
		return transport.decorateResourceList(parameters, resourceData, executor.operationContext.resourceControls)
	}

	return transport.filterResourceList(parameters, resourceData, executor.operationContext)
}

func (transport *Transport) decorateResourceList(parameters *resourceOperationParameters, resourceData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedResourceData := make([]interface{}, 0)

	for _, resource := range resourceData {
		resourceObject := resource.(map[string]interface{})

		if resourceObject[parameters.resourceIdentifierAttribute] == nil {
			log.Printf("[WARN] [http,proxy,docker,decorate] [message: unable to find resource identifier property in resource list element] [identifier_attribute: %s]", parameters.resourceIdentifierAttribute)
			continue
		}

		if parameters.resourceType == portainer.NetworkResourceControl {
			systemResourceControl := findSystemNetworkResourceControl(resourceObject)
			if systemResourceControl != nil {
				resourceObject = decorateObject(resourceObject, systemResourceControl)
				decoratedResourceData = append(decoratedResourceData, resourceObject)
				continue
			}
		}

		resourceIdentifier := resourceObject[parameters.resourceIdentifierAttribute].(string)
		resourceLabelsObject := parameters.labelsObjectSelector(resourceObject)

		resourceControl, err := transport.findResourceControl(resourceIdentifier, parameters.resourceType, resourceLabelsObject, resourceControls)
		if err != nil {
			return nil, err
		}

		if resourceControl != nil {
			resourceObject = decorateObject(resourceObject, resourceControl)
		}

		decoratedResourceData = append(decoratedResourceData, resourceObject)
	}

	return decoratedResourceData, nil
}

func (transport *Transport) filterResourceList(parameters *resourceOperationParameters, resourceData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredResourceData := make([]interface{}, 0)

	for _, resource := range resourceData {
		resourceObject := resource.(map[string]interface{})
		if resourceObject[parameters.resourceIdentifierAttribute] == nil {
			log.Printf("[WARN] [http,proxy,docker,filter] [message: unable to find resource identifier property in resource list element] [identifier_attribute: %s]", parameters.resourceIdentifierAttribute)
			continue
		}

		resourceIdentifier := resourceObject[parameters.resourceIdentifierAttribute].(string)
		resourceLabelsObject := parameters.labelsObjectSelector(resourceObject)

		if parameters.resourceType == portainer.NetworkResourceControl {
			systemResourceControl := findSystemNetworkResourceControl(resourceObject)
			if systemResourceControl != nil {
				resourceObject = decorateObject(resourceObject, systemResourceControl)
				filteredResourceData = append(filteredResourceData, resourceObject)
				continue
			}
		}

		resourceControl, err := transport.findResourceControl(resourceIdentifier, parameters.resourceType, resourceLabelsObject, context.resourceControls)
		if err != nil {
			return nil, err
		}

		if resourceControl == nil {
			if context.isAdmin || context.endpointResourceAccess {
				filteredResourceData = append(filteredResourceData, resourceObject)
			}
			continue
		}

		if context.isAdmin || context.endpointResourceAccess || portainer.UserCanAccessResource(context.userID, context.userTeamIDs, resourceControl) {
			resourceObject = decorateObject(resourceObject, resourceControl)
			filteredResourceData = append(filteredResourceData, resourceObject)
		}
	}

	return filteredResourceData, nil
}

func (transport *Transport) findResourceControl(resourceIdentifier string, resourceType portainer.ResourceControlType, resourceLabelsObject map[string]interface{}, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	resourceControl := portainer.GetResourceControlByResourceIDAndType(resourceIdentifier, resourceType, resourceControls)
	if resourceControl != nil {
		return resourceControl, nil
	}

	if resourceLabelsObject != nil {
		if resourceLabelsObject[resourceLabelForDockerServiceID] != nil {
			inheritedServiceIdentifier := resourceLabelsObject[resourceLabelForDockerServiceID].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedServiceIdentifier, portainer.ServiceResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl, nil
			}
		}

		if resourceLabelsObject[resourceLabelForDockerSwarmStackName] != nil {
			inheritedSwarmStackIdentifier := resourceLabelsObject[resourceLabelForDockerSwarmStackName].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedSwarmStackIdentifier, portainer.StackResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl, nil
			}
		}

		if resourceLabelsObject[resourceLabelForDockerComposeStackName] != nil {
			inheritedComposeStackIdentifier := resourceLabelsObject[resourceLabelForDockerComposeStackName].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedComposeStackIdentifier, portainer.StackResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl, nil
			}
		}

		return transport.newResourceControlFromPortainerLabels(resourceLabelsObject, resourceIdentifier, resourceType)
	}

	return nil, nil
}

func decorateObject(object map[string]interface{}, resourceControl *portainer.ResourceControl) map[string]interface{} {
	if object["Portainer"] == nil {
		object["Portainer"] = make(map[string]interface{})
	}

	portainerMetadata := object["Portainer"].(map[string]interface{})
	portainerMetadata["ResourceControl"] = resourceControl
	return object
}
