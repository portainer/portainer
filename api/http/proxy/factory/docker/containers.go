package docker

import (
	"context"
	"errors"
	"net/http"

	"github.com/docker/docker/client"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/responseutils"
)

const (
	containerObjectIdentifier = "Id"
)

func getInheritedResourceControlFromContainerLabels(dockerClient *client.Client, containerID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	container, err := dockerClient.ContainerInspect(context.Background(), containerID)
	if err != nil {
		return nil, err
	}

	swarmStackName := container.Config.Labels[resourceLabelForDockerSwarmStackName]
	if swarmStackName != "" {
		return portainer.GetResourceControlByResourceIDAndType(swarmStackName, portainer.StackResourceControl, resourceControls), nil
	}

	serviceName := container.Config.Labels[resourceLabelForDockerServiceID]
	if serviceName != "" {
		return portainer.GetResourceControlByResourceIDAndType(serviceName, portainer.ServiceResourceControl, resourceControls), nil
	}

	composeStackName := container.Config.Labels[resourceLabelForDockerComposeStackName]
	if composeStackName != "" {
		return portainer.GetResourceControlByResourceIDAndType(composeStackName, portainer.StackResourceControl, resourceControls), nil
	}

	return nil, nil
}

// containerListOperation extracts the response as a JSON array, loop through the containers array
// decorate and/or filter the containers based on resource controls before rewriting the response
func (transport *Transport) containerListOperation(response *http.Response, executor *operationExecutor) error {
	var err error
	// ContainerList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/ContainerList
	responseArray, err := responseutils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin || executor.operationContext.endpointResourceAccess {
		responseArray, err = transport.decorateContainerList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = transport.filterContainerList(responseArray, executor.operationContext)
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
func (transport *Transport) containerInspectOperation(response *http.Response, executor *operationExecutor) error {
	// ContainerInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/ContainerInspect
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[containerObjectIdentifier] == nil {
		return errors.New("docker container identifier not found")
	}

	resourceControl, err := transport.findContainerResourceControl(responseObject, executor.operationContext.resourceControls, selectorContainerLabelsFromContainerInspectObject)
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

// findContainerResourceControl will search for a resource control object associated to the container or
// inherited from another resource (based on labels) in the following order: a Swarm service, a Swarm stack or a Compose stack.
// If no resource control is found, it will search for Portainer specific resource control labels and will generate
// a resource control based on these if they exist. Public access control label take precedence over user/team access control labels.
func (transport *Transport) findContainerResourceControl(responseObject map[string]interface{}, resourceControls []portainer.ResourceControl, labelSelector resourceLabelSelector) (*portainer.ResourceControl, error) {
	containerID := responseObject[containerObjectIdentifier].(string)

	resourceControl := portainer.GetResourceControlByResourceIDAndType(containerID, portainer.ContainerResourceControl, resourceControls)
	if resourceControl != nil {
		return resourceControl, nil
	}

	containerLabels := labelSelector(responseObject)
	if containerLabels != nil {
		if containerLabels[resourceLabelForDockerServiceID] != nil {
			inheritedServiceIdentifier := containerLabels[resourceLabelForDockerServiceID].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedServiceIdentifier, portainer.ServiceResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl, nil
			}
		}

		if containerLabels[resourceLabelForDockerSwarmStackName] != nil {
			inheritedSwarmStackIdentifier := containerLabels[resourceLabelForDockerSwarmStackName].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedSwarmStackIdentifier, portainer.StackResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl, nil
			}
		}

		if containerLabels[resourceLabelForDockerComposeStackName] != nil {
			inheritedComposeStackIdentifier := containerLabels[resourceLabelForDockerComposeStackName].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedComposeStackIdentifier, portainer.StackResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl, nil
			}
		}

		return transport.newResourceControlFromPortainerLabels(containerLabels, containerID, portainer.ContainerResourceControl)
	}

	return nil, nil
}

// selectorContainerLabelsFromContainerInspectObject retrieve the Labels of the container if present.
// Container schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ContainerInspect
func selectorContainerLabelsFromContainerInspectObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Config.Labels
	containerConfigObject := responseutils.GetJSONObject(responseObject, "Config")
	if containerConfigObject != nil {
		containerLabelsObject := responseutils.GetJSONObject(containerConfigObject, "Labels")
		return containerLabelsObject
	}
	return nil
}

// selectorContainerLabelsFromContainerListObject retrieve the Labels of the container if present.
// Container schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ContainerList
func selectorContainerLabelsFromContainerListObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Labels
	containerLabelsObject := responseutils.GetJSONObject(responseObject, "Labels")
	return containerLabelsObject
}

// decorateContainerList loops through all containers and decorates any container with an existing resource control.
// Resource controls checks are based on: resource identifier, service identifier (from label), stack identifier (from label).
// Resources controls can also be generated on the fly via specific Portainer labels.
// Container object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ContainerList
func (transport *Transport) decorateContainerList(containerData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedContainerData := make([]interface{}, 0)

	for _, container := range containerData {
		containerObject := container.(map[string]interface{})
		if containerObject[containerObjectIdentifier] == nil {
			return nil, errors.New("docker container identifier not found")
		}

		resourceControl, err := transport.findContainerResourceControl(containerObject, resourceControls, selectorContainerLabelsFromContainerListObject)
		if err != nil {
			return nil, err
		}

		if resourceControl != nil {
			containerObject = decorateObject(containerObject, resourceControl)
		}

		decoratedContainerData = append(decoratedContainerData, containerObject)
	}

	return decoratedContainerData, nil
}

// filterContainerList loops through all containers and filters authorized containers (access granted to the user based on existing resource control).
// Authorized containers are decorated during the process.
// Resource controls checks are based on: resource identifier, service identifier (from label), stack identifier (from label).
// Resources controls can also be generated on the fly via specific Portainer labels.
// Container object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ContainerList
func (transport *Transport) filterContainerList(containerData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredContainerData := make([]interface{}, 0)

	for _, container := range containerData {
		containerObject := container.(map[string]interface{})
		if containerObject[containerObjectIdentifier] == nil {
			return nil, errors.New("docker container identifier not found")
		}

		resourceControl, err := transport.findContainerResourceControl(containerObject, context.resourceControls, selectorContainerLabelsFromContainerListObject)
		if err != nil {
			return nil, err
		}

		if resourceControl == nil {
			if context.isAdmin || context.endpointResourceAccess {
				filteredContainerData = append(filteredContainerData, containerObject)
			}
			continue
		}

		if context.isAdmin || context.endpointResourceAccess || portainer.UserCanAccessResource(context.userID, context.userTeamIDs, resourceControl) {
			containerObject = decorateObject(containerObject, resourceControl)
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

		containerLabels := selectorContainerLabelsFromContainerListObject(containerObject)
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
