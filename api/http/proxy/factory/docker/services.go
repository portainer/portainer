package docker

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/utils"
	"github.com/portainer/portainer/api/internal/authorization"
)

const (
	serviceObjectIdentifier = "ID"
)

func getInheritedResourceControlFromServiceLabels(dockerClient *client.Client, endpointID portainer.EndpointID, serviceID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	service, _, err := dockerClient.ServiceInspectWithRaw(context.Background(), serviceID, types.ServiceInspectOptions{})
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
	//ServiceInspect response is a JSON object
	//https://docs.docker.com/engine/api/v1.28/#operation/ServiceInspect
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
func selectorServiceLabels(responseObject map[string]interface{}) map[string]interface{} {
	serviceSpecObject := utils.GetJSONObject(responseObject, "Spec")
	if serviceSpecObject != nil {
		return utils.GetJSONObject(serviceSpecObject, "Labels")
	}
	return nil
}

func (transport *Transport) decorateServiceCreationOperation(request *http.Request) (*http.Response, error) {
	type PartialService struct {
		TaskTemplate struct {
			ContainerSpec struct {
				Mounts []struct {
					Type string
				}
			}
		}
	}

	forbiddenResponse := &http.Response{
		StatusCode: http.StatusForbidden,
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

		body, err := ioutil.ReadAll(request.Body)
		if err != nil {
			return nil, err
		}

		partialService := &PartialService{}
		err = json.Unmarshal(body, partialService)
		if err != nil {
			return nil, err
		}

		if !securitySettings.AllowBindMountsForRegularUsers && (len(partialService.TaskTemplate.ContainerSpec.Mounts) > 0) {
			for _, mount := range partialService.TaskTemplate.ContainerSpec.Mounts {
				if mount.Type == "bind" {
					return forbiddenResponse, errors.New("forbidden to use bind mounts")
				}
			}
		}

		request.Body = ioutil.NopCloser(bytes.NewBuffer(body))
	}

	return transport.replaceRegistryAuthenticationHeader(request)
}
