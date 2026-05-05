package docker

import (
	"bytes"
	"context"
	"io"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/utils"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/logs"

	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/client"
	"github.com/segmentio/encoding/json"
)

const serviceObjectIdentifier = "ID"

type partialServiceSpec struct {
	TaskTemplate struct {
		ContainerSpec struct {
			CapabilityAdd  []string       `json:"CapabilityAdd"`
			CapabilityDrop []string       `json:"CapabilityDrop"`
			Sysctls        map[string]any `json:"Sysctls"`
			Privileges     *struct {
				Seccomp  *struct{ Mode string } `json:"Seccomp"`
				AppArmor *struct{ Mode string } `json:"AppArmor"`
			} `json:"Privileges"`
			Mounts []struct {
				Type          string `json:"Type"`
				VolumeOptions *struct {
					DriverConfig *struct {
						Options map[string]string `json:"Options"`
					} `json:"DriverConfig"`
				} `json:"VolumeOptions"`
			} `json:"Mounts"`
		} `json:"ContainerSpec"`
	} `json:"TaskTemplate"`
}

func CheckServiceBodyRestrictions(request *http.Request, securitySettings *portainer.EndpointSecuritySettings) error {
	defer logs.CloseAndLogErr(request.Body)

	body, err := io.ReadAll(request.Body)
	if err != nil {
		return err
	}

	spec := &partialServiceSpec{}
	if err := json.Unmarshal(body, spec); err != nil {
		return err
	}

	containerSpec := spec.TaskTemplate.ContainerSpec

	if !securitySettings.AllowContainerCapabilitiesForRegularUsers && (len(containerSpec.CapabilityAdd) > 0 || len(containerSpec.CapabilityDrop) > 0) {
		return ErrContainerCapabilitiesForbidden
	}

	if !securitySettings.AllowSysctlSettingForRegularUsers && len(containerSpec.Sysctls) > 0 {
		return ErrSysCtlSettingsForbidden
	}

	if !securitySettings.AllowBindMountsForRegularUsers {
		for _, mount := range containerSpec.Mounts {
			if mount.Type == "bind" {
				return ErrBindMountsForbidden
			}

			if mount.VolumeOptions != nil && mount.VolumeOptions.DriverConfig != nil {
				if mount.VolumeOptions.DriverConfig.Options["type"] == "bind" {
					return ErrBindMountsForbidden
				}
			}
		}
	}

	request.Body = io.NopCloser(bytes.NewBuffer(body))

	return nil
}

func getInheritedResourceControlFromServiceLabels(dockerClient *client.Client, endpointID portainer.EndpointID, serviceID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	service, _, err := dockerClient.ServiceInspectWithRaw(context.Background(), serviceID, swarm.ServiceInspectOptions{})
	if err != nil {
		return nil, err
	}

	stackResourceID := getStackResourceIDFromLabels(service.Spec.Labels, endpointID)
	if stackResourceID != "" {
		return authorization.GetResourceControlByResourceIDAndType(stackResourceID, portainer.StackResourceControl, resourceControls), nil
	}

	return nil, nil
}

// serviceListOperation extracts the response as a JSON array, loop through the service array
// decorate and/or filter the services based on resource controls before rewriting the response.
func (transport *Transport) serviceListOperation(response *http.Response, executor *operationExecutor) error {
	// ServiceList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
	responseArray, err := utils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: serviceObjectIdentifier,
		resourceType:                portainer.ServiceResourceControl,
		labelsObjectSelector:        selectorServiceLabels,
	}

	responseArray, err = transport.applyAccessControlOnResourceList(resourceOperationParameters, responseArray, executor)
	if err != nil {
		return err
	}

	return utils.RewriteResponse(response, responseArray, http.StatusOK)
}

// serviceInspectOperation extracts the response as a JSON object, verify that the user
// has access to the service based on resource control and either rewrite an access denied response or a decorated service.
func (transport *Transport) serviceInspectOperation(response *http.Response, executor *operationExecutor) error {
	// ServiceInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/ServiceInspect
	responseObject, err := utils.GetResponseAsJSONObject(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: serviceObjectIdentifier,
		resourceType:                portainer.ServiceResourceControl,
		labelsObjectSelector:        selectorServiceLabels,
	}

	return transport.applyAccessControlOnResource(resourceOperationParameters, responseObject, response, executor)
}

// selectorServiceLabels retrieve the labels object associated to the service object.
// Labels are available under the "Spec.Labels" property.
// API schema references:
// https://docs.docker.com/engine/api/v1.28/#operation/ServiceInspect
// https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
func selectorServiceLabels(responseObject map[string]any) map[string]any {
	serviceSpecObject := utils.GetJSONObject(responseObject, "Spec")
	if serviceSpecObject != nil {
		return utils.GetJSONObject(serviceSpecObject, "Labels")
	}

	return nil
}

func (transport *Transport) decorateServiceCreationOperation(request *http.Request) (*http.Response, error) {
	isAdminOrEndpointAdmin, err := transport.isAdminOrEndpointAdmin(request)
	if err != nil {
		return nil, err
	}

	if isAdminOrEndpointAdmin {
		return transport.replaceRegistryAuthenticationHeader(request)
	}

	securitySettings, err := transport.fetchEndpointSecuritySettings()
	if err != nil {
		return nil, err
	}

	if err := CheckServiceBodyRestrictions(request, securitySettings); err != nil {
		return &http.Response{
			StatusCode: http.StatusForbidden,
			Body:       io.NopCloser(bytes.NewBufferString("Access denied: insufficient permissions to create service with specified configuration")),
		}, err
	}

	return transport.replaceRegistryAuthenticationHeader(request)
}

func (transport *Transport) decorateServiceUpdateOperation(request *http.Request, serviceID string) (*http.Response, error) {
	isAdminOrEndpointAdmin, err := transport.isAdminOrEndpointAdmin(request)
	if err != nil {
		return nil, err
	}

	if isAdminOrEndpointAdmin {
		if err := transport.decorateRegistryAuthenticationHeader(request); err != nil {
			return nil, err
		}

		return transport.executeDockerRequest(request)
	}

	securitySettings, err := transport.fetchEndpointSecuritySettings()
	if err != nil {
		return nil, err
	}

	if err := CheckServiceBodyRestrictions(request, securitySettings); err != nil {
		return &http.Response{
			StatusCode: http.StatusForbidden,
			Body:       io.NopCloser(bytes.NewBufferString("Access denied: insufficient permissions to update service with specified configuration")),
		}, err
	}

	if err := transport.decorateRegistryAuthenticationHeader(request); err != nil {
		return nil, err
	}

	return transport.restrictedResourceOperation(request, serviceID, serviceID, portainer.ServiceResourceControl, false)
}
