package docker

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/utils"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"

	"github.com/docker/docker/client"
	"github.com/segmentio/encoding/json"
)

const containerObjectIdentifier = "Id"

var (
	ErrPrivilegedModeForbidden        = errors.New("forbidden to use privileged mode")
	ErrPIDHostNamespaceForbidden      = errors.New("forbidden to use pid host namespace")
	ErrDeviceMappingForbidden         = errors.New("forbidden to use device mapping")
	ErrSysCtlSettingsForbidden        = errors.New("forbidden to use sysctl settings")
	ErrContainerCapabilitiesForbidden = errors.New("forbidden to use container capabilities")
	ErrBindMountsForbidden            = errors.New("forbidden to use bind mounts")
)

func getInheritedResourceControlFromContainerLabels(dockerClient *client.Client, endpointID portainer.EndpointID, containerID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	container, err := dockerClient.ContainerInspect(context.Background(), containerID)
	if err != nil {
		return nil, err
	}

	serviceName := container.Config.Labels[resourceLabelForDockerServiceID]
	if serviceName != "" {
		serviceResourceControl := authorization.GetResourceControlByResourceIDAndType(serviceName, portainer.ServiceResourceControl, resourceControls)
		if serviceResourceControl != nil {
			return serviceResourceControl, nil
		}
	}

	stackResourceID := getStackResourceIDFromLabels(container.Config.Labels, endpointID)
	if stackResourceID != "" {
		return authorization.GetResourceControlByResourceIDAndType(stackResourceID, portainer.StackResourceControl, resourceControls), nil
	}

	return nil, nil
}

// containerListOperation extracts the response as a JSON array, loop through the containers array
// decorate and/or filter the containers based on resource controls before rewriting the response.
func (transport *Transport) containerListOperation(response *http.Response, executor *operationExecutor) error {
	// ContainerList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/ContainerList
	responseArray, err := utils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: containerObjectIdentifier,
		resourceType:                portainer.ContainerResourceControl,
		labelsObjectSelector:        selectorContainerLabelsFromContainerListOperation,
	}

	responseArray, err = transport.applyAccessControlOnResourceList(resourceOperationParameters, responseArray, executor)
	if err != nil {
		return err
	}

	if executor.labelBlackList != nil {
		responseArray, err = filterContainersWithBlackListedLabels(responseArray, executor.labelBlackList)
		if err != nil {
			return err
		}
	}

	responseArray, err = transport.applyPortainerContainers(responseArray)
	if err != nil {
		return err
	}

	return utils.RewriteResponse(response, responseArray, http.StatusOK)
}

// containerInspectOperation extracts the response as a JSON object, verify that the user
// has access to the container based on resource control and either rewrite an access denied response or a decorated container.
func (transport *Transport) containerInspectOperation(response *http.Response, executor *operationExecutor) error {
	//ContainerInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/ContainerInspect
	responseObject, err := utils.GetResponseAsJSONObject(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: containerObjectIdentifier,
		resourceType:                portainer.ContainerResourceControl,
		labelsObjectSelector:        selectorContainerLabelsFromContainerInspectOperation,
	}

	responseObject, _ = transport.applyPortainerContainer(responseObject)

	return transport.applyAccessControlOnResource(resourceOperationParameters, responseObject, response, executor)
}

// selectorContainerLabelsFromContainerInspectOperation retrieve the labels object associated to the container object.
// This selector is specific to the containerInspect Docker operation.
// Labels are available under the "Config.Labels" property.
// API schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ContainerInspect
func selectorContainerLabelsFromContainerInspectOperation(responseObject map[string]any) map[string]any {
	containerConfigObject := utils.GetJSONObject(responseObject, "Config")
	if containerConfigObject != nil {
		containerLabelsObject := utils.GetJSONObject(containerConfigObject, "Labels")
		return containerLabelsObject
	}

	return nil
}

// selectorContainerLabelsFromContainerListOperation retrieve the labels object associated to the container object.
// This selector is specific to the containerList Docker operation.
// Labels are available under the "Labels" property.
// API schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ContainerList
func selectorContainerLabelsFromContainerListOperation(responseObject map[string]any) map[string]any {
	containerLabelsObject := utils.GetJSONObject(responseObject, "Labels")

	return containerLabelsObject
}

// filterContainersWithLabels loops through a list of containers, and filters containers that do not contains
// any labels in the labels black list.
func filterContainersWithBlackListedLabels(containerData []any, labelBlackList []portainer.Pair) ([]any, error) {
	filteredContainerData := make([]any, 0)

	for _, container := range containerData {
		containerObject := container.(map[string]any)

		containerLabels := selectorContainerLabelsFromContainerListOperation(containerObject)

		if containerHasBlackListedLabel(containerLabels, labelBlackList) {
			continue
		}

		filteredContainerData = append(filteredContainerData, containerObject)
	}

	return filteredContainerData, nil
}

func containerHasBlackListedLabel(containerLabels map[string]any, labelBlackList []portainer.Pair) bool {
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

func (transport *Transport) decorateContainerCreationOperation(request *http.Request, resourceIdentifierAttribute string, resourceType portainer.ResourceControlType) (*http.Response, error) {
	type PartialContainer struct {
		HostConfig struct {
			Privileged bool           `json:"Privileged"`
			PidMode    string         `json:"PidMode"`
			Devices    []any          `json:"Devices"`
			Sysctls    map[string]any `json:"Sysctls"`
			CapAdd     []string       `json:"CapAdd"`
			CapDrop    []string       `json:"CapDrop"`
			Binds      []string       `json:"Binds"`
		} `json:"HostConfig"`
	}

	forbiddenResponse := &http.Response{
		StatusCode: http.StatusForbidden,
	}

	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	isAdminOrEndpointAdmin, err := transport.isAdminOrEndpointAdmin(request)
	if err != nil {
		return nil, err
	}

	if !isAdminOrEndpointAdmin {
		securitySettings, err := transport.fetchEndpointSecuritySettings()
		if err != nil {
			return nil, err
		}

		body, err := io.ReadAll(request.Body)
		if err != nil {
			return nil, err
		}

		partialContainer := &PartialContainer{}
		if err := json.Unmarshal(body, partialContainer); err != nil {
			return nil, err
		}

		if !securitySettings.AllowPrivilegedModeForRegularUsers && partialContainer.HostConfig.Privileged {
			return forbiddenResponse, ErrPrivilegedModeForbidden
		}

		if !securitySettings.AllowHostNamespaceForRegularUsers && partialContainer.HostConfig.PidMode == "host" {
			return forbiddenResponse, ErrPIDHostNamespaceForbidden
		}

		if !securitySettings.AllowDeviceMappingForRegularUsers && len(partialContainer.HostConfig.Devices) > 0 {
			return forbiddenResponse, ErrDeviceMappingForbidden
		}

		if !securitySettings.AllowSysctlSettingForRegularUsers && len(partialContainer.HostConfig.Sysctls) > 0 {
			return forbiddenResponse, ErrSysCtlSettingsForbidden
		}

		if !securitySettings.AllowContainerCapabilitiesForRegularUsers && (len(partialContainer.HostConfig.CapAdd) > 0 || len(partialContainer.HostConfig.CapDrop) > 0) {
			return nil, ErrContainerCapabilitiesForbidden
		}

		if !securitySettings.AllowBindMountsForRegularUsers && (len(partialContainer.HostConfig.Binds) > 0) {
			for _, bind := range partialContainer.HostConfig.Binds {
				if strings.HasPrefix(bind, "/") {
					return forbiddenResponse, ErrBindMountsForbidden
				}
			}
		}

		request.Body = io.NopCloser(bytes.NewBuffer(body))
	}

	response, err := transport.executeDockerRequest(request)
	if err != nil {
		return response, err
	}

	if response.StatusCode == http.StatusCreated {
		err = transport.decorateGenericResourceCreationResponse(response, resourceIdentifierAttribute, resourceType, tokenData.ID)
	}

	return response, err
}
