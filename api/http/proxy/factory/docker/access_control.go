package docker

import (
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/utils"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/slicesx"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/rs/zerolog/log"
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
	resourceLabelsObjectSelector func(map[string]any) map[string]any

	resourceOperationParameters struct {
		resourceIdentifierAttribute string
		resourceType                portainer.ResourceControlType
		labelsObjectSelector        resourceLabelsObjectSelector
	}
)

func getUniqueElements(items string) []string {
	xs := strings.Split(items, ",")
	xs = slicesx.Map(xs, strings.TrimSpace)
	xs = slicesx.Filter(xs, func(x string) bool { return len(x) > 0 })

	return slicesx.Unique(xs)
}

func (transport *Transport) newResourceControlFromPortainerLabels(labelsObject map[string]any, resourceID string, resourceType portainer.ResourceControlType) (*portainer.ResourceControl, error) {
	if labelsObject[resourceLabelForPortainerPublicResourceControl] != nil {
		resourceControl := authorization.NewPublicResourceControl(resourceID, resourceType)

		if err := transport.dataStore.ResourceControl().Create(resourceControl); err != nil {
			return nil, err
		}

		return resourceControl, nil
	}

	teamNames := make([]string, 0)
	userNames := make([]string, 0)

	if labelsObject[resourceLabelForPortainerTeamResourceControl] != nil {
		concatenatedTeamNames := labelsObject[resourceLabelForPortainerTeamResourceControl].(string)
		teamNames = getUniqueElements(concatenatedTeamNames)
	}

	if labelsObject[resourceLabelForPortainerUserResourceControl] != nil {
		concatenatedUserNames := labelsObject[resourceLabelForPortainerUserResourceControl].(string)
		userNames = getUniqueElements(concatenatedUserNames)
	}

	if len(teamNames) == 0 && len(userNames) == 0 {
		return nil, nil
	}

	teamIDs := make([]portainer.TeamID, 0)
	userIDs := make([]portainer.UserID, 0)

	for _, name := range teamNames {
		team, err := transport.dataStore.Team().TeamByName(name)
		if err != nil {
			log.Warn().
				Str("name", name).
				Str("resource_id", resourceID).
				Msg("unknown team name in access control label, ignoring access control rule for this team")

			continue
		}

		teamIDs = append(teamIDs, team.ID)
	}

	for _, name := range userNames {
		user, err := transport.dataStore.User().UserByUsername(name)
		if err != nil {
			log.Warn().
				Str("name", name).
				Str("resource_id", resourceID).
				Msg("unknown user name in access control label, ignoring access control rule for this user")

			continue
		}

		userIDs = append(userIDs, user.ID)
	}

	resourceControl := authorization.NewRestrictedResourceControl(resourceID, resourceType, userIDs, teamIDs)

	if err := transport.dataStore.ResourceControl().Create(resourceControl); err != nil {
		return nil, err
	}

	return resourceControl, nil
}

func (transport *Transport) createPrivateResourceControl(resourceIdentifier string, resourceType portainer.ResourceControlType, userID portainer.UserID) (*portainer.ResourceControl, error) {
	resourceControl := authorization.NewPrivateResourceControl(resourceIdentifier, resourceType, userID)

	if err := transport.dataStore.ResourceControl().Create(resourceControl); err != nil {
		log.Error().
			Str("resource", resourceIdentifier).
			Err(err).
			Msg("unable to persist resource control")

		return nil, err
	}

	return resourceControl, nil
}

func (transport *Transport) getInheritedResourceControlFromServiceOrStack(resourceIdentifier, nodeName string, resourceType portainer.ResourceControlType, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	client, err := transport.dockerClientFactory.CreateClient(transport.endpoint, nodeName, nil)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	switch resourceType {
	case portainer.ContainerResourceControl:
		return getInheritedResourceControlFromContainerLabels(client, transport.endpoint.ID, resourceIdentifier, resourceControls)
	case portainer.NetworkResourceControl:
		return getInheritedResourceControlFromNetworkLabels(client, transport.endpoint.ID, resourceIdentifier, resourceControls)
	case portainer.VolumeResourceControl:
		return getInheritedResourceControlFromVolumeLabels(client, transport.endpoint.ID, resourceIdentifier, resourceControls)
	case portainer.ServiceResourceControl:
		return getInheritedResourceControlFromServiceLabels(client, transport.endpoint.ID, resourceIdentifier, resourceControls)
	case portainer.ConfigResourceControl:
		return getInheritedResourceControlFromConfigLabels(client, transport.endpoint.ID, resourceIdentifier, resourceControls)
	case portainer.SecretResourceControl:
		return getInheritedResourceControlFromSecretLabels(client, transport.endpoint.ID, resourceIdentifier, resourceControls)
	}

	return nil, nil
}

func (transport *Transport) applyAccessControlOnResource(parameters *resourceOperationParameters, responseObject map[string]any, response *http.Response, executor *operationExecutor) error {
	if responseObject[parameters.resourceIdentifierAttribute] == nil {
		log.Warn().
			Str("identifier_attribute", parameters.resourceIdentifierAttribute).
			Msg("unable to find resource identifier property in resource object")

		return nil
	}

	if parameters.resourceType == portainer.NetworkResourceControl {
		systemResourceControl := findSystemNetworkResourceControl(responseObject)
		if systemResourceControl != nil {
			responseObject = decorateObject(responseObject, systemResourceControl)

			return utils.RewriteResponse(response, responseObject, http.StatusOK)
		}
	}

	resourceIdentifier := responseObject[parameters.resourceIdentifierAttribute].(string)
	resourceLabelsObject := parameters.labelsObjectSelector(responseObject)

	resourceControl, err := transport.findResourceControl(resourceIdentifier, parameters.resourceType, resourceLabelsObject, executor.operationContext.resourceControls)
	if err != nil {
		return err
	}

	if resourceControl == nil && (executor.operationContext.isAdmin) {
		return utils.RewriteResponse(response, responseObject, http.StatusOK)
	}

	if executor.operationContext.isAdmin || (resourceControl != nil && authorization.UserCanAccessResource(executor.operationContext.userID, executor.operationContext.userTeamIDs, resourceControl)) {
		responseObject = decorateObject(responseObject, resourceControl)

		return utils.RewriteResponse(response, responseObject, http.StatusOK)
	}

	return utils.RewriteAccessDeniedResponse(response)
}

func (transport *Transport) applyAccessControlOnResourceList(parameters *resourceOperationParameters, resourceData []any, executor *operationExecutor) ([]any, error) {
	if executor.operationContext.isAdmin {
		return transport.decorateResourceList(parameters, resourceData, executor.operationContext.resourceControls)
	}

	return transport.filterResourceList(parameters, resourceData, executor.operationContext)
}

func (transport *Transport) decorateResourceList(parameters *resourceOperationParameters, resourceData []any, resourceControls []portainer.ResourceControl) ([]any, error) {
	decoratedResourceData := make([]any, 0)

	for _, resource := range resourceData {
		resourceObject := resource.(map[string]any)

		if resourceObject[parameters.resourceIdentifierAttribute] == nil {
			log.Warn().
				Str("identifier_attribute", parameters.resourceIdentifierAttribute).
				Msg("unable to find resource identifier property in resource list element")

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

func (transport *Transport) filterResourceList(parameters *resourceOperationParameters, resourceData []any, context *restrictedDockerOperationContext) ([]any, error) {
	filteredResourceData := make([]any, 0)

	for _, resource := range resourceData {
		resourceObject := resource.(map[string]any)
		if resourceObject[parameters.resourceIdentifierAttribute] == nil {
			log.Warn().
				Str("identifier_attribute", parameters.resourceIdentifierAttribute).
				Msg("unable to find resource identifier property in resource list element")

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
			if context.isAdmin {
				filteredResourceData = append(filteredResourceData, resourceObject)
			}

			continue
		}

		if context.isAdmin || authorization.UserCanAccessResource(context.userID, context.userTeamIDs, resourceControl) {
			resourceObject = decorateObject(resourceObject, resourceControl)
			filteredResourceData = append(filteredResourceData, resourceObject)
		}
	}

	return filteredResourceData, nil
}

func (transport *Transport) findResourceControl(resourceIdentifier string, resourceType portainer.ResourceControlType, resourceLabelsObject map[string]any, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	resourceControl := authorization.GetResourceControlByResourceIDAndType(resourceIdentifier, resourceType, resourceControls)
	if resourceControl != nil {
		return resourceControl, nil
	}

	if resourceLabelsObject == nil {
		return nil, nil
	}

	if resourceLabelsObject[resourceLabelForDockerServiceID] != nil {
		inheritedServiceIdentifier := resourceLabelsObject[resourceLabelForDockerServiceID].(string)
		resourceControl = authorization.GetResourceControlByResourceIDAndType(inheritedServiceIdentifier, portainer.ServiceResourceControl, resourceControls)

		if resourceControl != nil {
			return resourceControl, nil
		}
	}

	if resourceLabelsObject[resourceLabelForDockerSwarmStackName] != nil {
		stackName := resourceLabelsObject[resourceLabelForDockerSwarmStackName].(string)
		stackResourceID := stackutils.ResourceControlID(transport.endpoint.ID, stackName)
		resourceControl = authorization.GetResourceControlByResourceIDAndType(stackResourceID, portainer.StackResourceControl, resourceControls)

		if resourceControl != nil {
			return resourceControl, nil
		}
	}

	if resourceLabelsObject[resourceLabelForDockerComposeStackName] != nil {
		stackName := resourceLabelsObject[resourceLabelForDockerComposeStackName].(string)
		stackResourceID := stackutils.ResourceControlID(transport.endpoint.ID, stackName)
		resourceControl = authorization.GetResourceControlByResourceIDAndType(stackResourceID, portainer.StackResourceControl, resourceControls)

		if resourceControl != nil {
			return resourceControl, nil
		}
	}

	return transport.newResourceControlFromPortainerLabels(resourceLabelsObject, resourceIdentifier, resourceType)
}

func getStackResourceIDFromLabels(resourceLabelsObject map[string]string, endpointID portainer.EndpointID) string {
	if resourceLabelsObject[resourceLabelForDockerSwarmStackName] != "" {
		stackName := resourceLabelsObject[resourceLabelForDockerSwarmStackName]

		return stackutils.ResourceControlID(endpointID, stackName)
	}

	if resourceLabelsObject[resourceLabelForDockerComposeStackName] != "" {
		stackName := resourceLabelsObject[resourceLabelForDockerComposeStackName]

		return stackutils.ResourceControlID(endpointID, stackName)
	}

	return ""
}

func decorateObject(object map[string]any, resourceControl *portainer.ResourceControl) map[string]any {
	if object["Portainer"] == nil {
		object["Portainer"] = make(map[string]any)
	}

	portainerMetadata := object["Portainer"].(map[string]any)
	portainerMetadata["ResourceControl"] = resourceControl

	return object
}
