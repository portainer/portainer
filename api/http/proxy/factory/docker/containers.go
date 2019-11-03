package docker

import (
	"context"
	"net/http"

	"github.com/docker/docker/client"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/responseutils"
)

const (
	errDockerContainerIdentifierNotFound = portainer.Error("Docker container identifier not found")
	// identifier attribute in inspect/list/create response
	containerIdentifier                     = "Id"
	containerLabelForServiceIdentifier      = "com.docker.swarm.service.id"
	containerLabelForSwarmStackIdentifier   = "com.docker.stack.namespace"
	containerLabelForComposeStackIdentifier = "com.docker.compose.project"
)

func getInheritedResourceControlFromContainerLabels(dockerClient *client.Client, containerID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	container, err := dockerClient.ContainerInspect(context.Background(), containerID)
	if err != nil {
		return nil, err
	}

	serviceName := container.Config.Labels[containerLabelForServiceIdentifier]
	if serviceName != "" {
		return portainer.GetResourceControlByResourceIDAndType(serviceName, portainer.ServiceResourceControl, resourceControls), nil
	}

	swarmStackName := container.Config.Labels[containerLabelForSwarmStackIdentifier]
	if swarmStackName != "" {
		return portainer.GetResourceControlByResourceIDAndType(swarmStackName, portainer.StackResourceControl, resourceControls), nil
	}

	composeStackName := container.Config.Labels[containerLabelForComposeStackIdentifier]
	if composeStackName != "" {
		return portainer.GetResourceControlByResourceIDAndType(composeStackName, portainer.StackResourceControl, resourceControls), nil
	}

	return nil, nil
}

// containerListOperation extracts the response as a JSON array, loop through the containers array
// decorate and/or filter the containers based on resource controls before rewriting the response
func containerListOperation(response *http.Response, executor *operationExecutor) error {
	var err error
	// ContainerList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/ContainerList
	responseArray, err := responseutils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess {
		responseArray, err = decorateContainerList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = filterContainerList(responseArray, executor.operationContext)
	}
	if err != nil {
		return err
	}

	if executor.labelBlackList != nil {
		responseArray, err = filterContainersWithBlackListedLabels(responseArray, executor.labelBlackList)
		if err != nil {
			return err
		}
	}

	return responseutils.RewriteResponse(response, responseArray, http.StatusOK)
}

// containerInspectOperation extracts the response as a JSON object, verify that the user
// has access to the container based on resource control (check are done based on the containerID and optional Swarm service ID)
// and either rewrite an access denied response or a decorated container.
func containerInspectOperation(response *http.Response, executor *operationExecutor) error {
	// ContainerInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/ContainerInspect
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[containerIdentifier] == nil {
		return errDockerContainerIdentifierNotFound
	}

	resourceControl := findInheritedContainerResourceControl(responseObject, executor.operationContext.resourceControls)
	if resourceControl == nil && (executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess) {
		return responseutils.RewriteResponse(response, responseObject, http.StatusOK)
	}

	if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess || portainer.UserCanAccessResource(executor.operationContext.userID, executor.operationContext.userTeamIDs, resourceControl) {
		responseObject = decorateObject(responseObject, resourceControl)
		return responseutils.RewriteResponse(response, responseObject, http.StatusOK)
	}

	return responseutils.RewriteAccessDeniedResponse(response)
}

// findInheritedContainerResourceControl will search for a resource control object associated to the container or
// inherited from another resource (based on labels) in the following order: a Swarm service, a Swarm stack or a Compose stack.
func findInheritedContainerResourceControl(responseObject map[string]interface{}, resourceControls []portainer.ResourceControl) *portainer.ResourceControl {
	containerID := responseObject[containerIdentifier].(string)

	resourceControl := portainer.GetResourceControlByResourceIDAndType(containerID, portainer.ContainerResourceControl, resourceControls)
	if resourceControl != nil {
		return resourceControl
	}

	containerLabels := extractContainerLabelsFromContainerInspectObject(responseObject)
	if containerLabels != nil {
		if containerLabels[containerLabelForServiceIdentifier] != nil {
			inheritedServiceIdentifier := containerLabels[containerLabelForServiceIdentifier].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedServiceIdentifier, portainer.ServiceResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl
			}
		}

		if containerLabels[containerLabelForSwarmStackIdentifier] != nil {
			inheritedSwarmStackIdentifier := containerLabels[containerLabelForSwarmStackIdentifier].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedSwarmStackIdentifier, portainer.StackResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl
			}
		}

		if containerLabels[containerLabelForComposeStackIdentifier] != nil {
			inheritedComposeStackIdentifier := containerLabels[containerLabelForComposeStackIdentifier].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedComposeStackIdentifier, portainer.StackResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl
			}
		}
	}

	return nil
}

// extractContainerLabelsFromContainerInspectObject retrieve the Labels of the container if present.
// Container schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ContainerInspect
func extractContainerLabelsFromContainerInspectObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Config.Labels
	containerConfigObject := responseutils.GetJSONObject(responseObject, "Config")
	if containerConfigObject != nil {
		containerLabelsObject := responseutils.GetJSONObject(containerConfigObject, "Labels")
		return containerLabelsObject
	}
	return nil
}

// extractContainerLabelsFromContainerListObject retrieve the Labels of the container if present.
// Container schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ContainerList
func extractContainerLabelsFromContainerListObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Labels
	containerLabelsObject := responseutils.GetJSONObject(responseObject, "Labels")
	return containerLabelsObject
}

// decorateContainerList loops through all containers and decorates any container with an existing resource control.
// Resource controls checks are based on: resource identifier, service identifier (from label), stack identifier (from label).
// Container object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ContainerList
func decorateContainerList(containerData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedContainerData := make([]interface{}, 0)

	for _, container := range containerData {

		containerObject := container.(map[string]interface{})
		if containerObject[containerIdentifier] == nil {
			return nil, errDockerContainerIdentifierNotFound
		}

		containerID := containerObject[containerIdentifier].(string)
		containerObject = decorateResourceWithAccessControl(containerObject, containerID, resourceControls, portainer.ContainerResourceControl)

		containerLabels := extractContainerLabelsFromContainerListObject(containerObject)
		containerObject = decorateResourceWithAccessControlFromLabel(containerLabels, containerObject, containerLabelForServiceIdentifier, resourceControls, portainer.ServiceResourceControl)
		containerObject = decorateResourceWithAccessControlFromLabel(containerLabels, containerObject, containerLabelForSwarmStackIdentifier, resourceControls, portainer.StackResourceControl)
		containerObject = decorateResourceWithAccessControlFromLabel(containerLabels, containerObject, containerLabelForComposeStackIdentifier, resourceControls, portainer.StackResourceControl)

		decoratedContainerData = append(decoratedContainerData, containerObject)
	}

	return decoratedContainerData, nil
}

// filterContainerList loops through all containers and filters authorized containers (access granted to the user based on existing resource control).
// Authorized containers are decorated during the process.
// Resource controls checks are based on: resource identifier, service identifier (from label), stack identifier (from label).
// Container object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ContainerList
func filterContainerList(containerData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredContainerData := make([]interface{}, 0)

	for _, container := range containerData {
		containerObject := container.(map[string]interface{})
		if containerObject[containerIdentifier] == nil {
			return nil, errDockerContainerIdentifierNotFound
		}

		containerID := containerObject[containerIdentifier].(string)
		containerObject, access := applyResourceAccessControl(containerObject, containerID, context, portainer.ContainerResourceControl)
		if !access {
			containerLabels := extractContainerLabelsFromContainerListObject(containerObject)
			containerObject, access = applyResourceAccessControlFromLabel(containerLabels, containerObject, containerLabelForComposeStackIdentifier, context, portainer.StackResourceControl)
			if !access {
				containerObject, access = applyResourceAccessControlFromLabel(containerLabels, containerObject, containerLabelForServiceIdentifier, context, portainer.ServiceResourceControl)
				if !access {
					containerObject, access = applyResourceAccessControlFromLabel(containerLabels, containerObject, containerLabelForSwarmStackIdentifier, context, portainer.StackResourceControl)
				}
			}
		}

		if access {
			filteredContainerData = append(filteredContainerData, containerObject)
		}
	}

	return filteredContainerData, nil
}

// filterContainersWithLabels loops through a list of containers, and filters containers that do not contains
// any labels in the labels black list.
func filterContainersWithBlackListedLabels(containerData []interface{}, labelBlackList []portainer.Pair) ([]interface{}, error) {
	filteredContainerData := make([]interface{}, 0)

	for _, container := range containerData {
		containerObject := container.(map[string]interface{})

		containerLabels := extractContainerLabelsFromContainerListObject(containerObject)
		if containerLabels != nil {
			if !containerHasBlackListedLabel(containerLabels, labelBlackList) {
				filteredContainerData = append(filteredContainerData, containerObject)
			}
		} else {
			filteredContainerData = append(filteredContainerData, containerObject)
		}
	}

	return filteredContainerData, nil
}

func containerHasBlackListedLabel(containerLabels map[string]interface{}, labelBlackList []portainer.Pair) bool {
	for key, value := range containerLabels {
		labelName := key
		labelValue := value.(string)

		for _, blackListedLabel := range labelBlackList {
			if blackListedLabel.Name == labelName && blackListedLabel.Value == labelValue {
				return true
			}
		}
	}

	return false
}
