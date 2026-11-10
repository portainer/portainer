package docker

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"slices"

	portainer "github.com/portainer/portainer/api"

	"github.com/docker/docker/api/types/network"

	"github.com/docker/docker/client"
	"github.com/segmentio/encoding/json"

	"github.com/portainer/portainer/api/http/proxy/factory/utils"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/api/stacks/stackutils"
)

const (
	networkObjectIdentifier = "Id"
	networkObjectName       = "Name"
)

func (transport *Transport) authorizeReferencedNetworks(userID portainer.UserID, networkNames []string, getClient func() (*client.Client, error)) error {
	if len(networkNames) == 0 {
		return nil
	}

	access, err := stackutils.LoadNetworkAccess(transport.dataStore.TeamMembership(), transport.dataStore.ResourceControl(), transport.endpoint.ID, userID)
	if err != nil {
		return err
	}

	dockerClient, err := getClient()
	if err != nil {
		return err
	}
	defer logs.CloseAndLogErr(dockerClient)

	return access.AuthorizeNetworks(context.Background(), dockerClient, networkNames, false)
}

func (transport *Transport) networkConnectionOperation(request *http.Request, networkID string) (*http.Response, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	if tokenData.Role == portainer.AdministratorRole {
		return transport.executeDockerRequest(request)
	}

	body, err := io.ReadAll(request.Body)
	if err != nil {
		return nil, err
	}

	request.Body = io.NopCloser(bytes.NewReader(body))

	var connection struct {
		Container string `json:"Container"`
	}
	if err := json.Unmarshal(body, &connection); err != nil {
		return nil, err
	}

	getClient := func() (*client.Client, error) {
		return transport.dockerClientFactory.CreateClient(transport.endpoint, request.Header.Get(portainer.PortainerAgentTargetHeader), nil)
	}

	canAccess, err := transport.userCanAccessResources(tokenData.ID, []string{connection.Container}, portainer.ContainerResourceControl, getClient)
	if err != nil {
		return nil, err
	}

	if !canAccess {
		return utils.WriteAccessDeniedResponse()
	}

	return transport.restrictedResourceOperation(request, networkID, networkID, portainer.NetworkResourceControl, false)
}

func getInheritedResourceControlFromNetworkLabels(dockerClient *client.Client, endpointID portainer.EndpointID, networkID string, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {
	network, err := dockerClient.NetworkInspect(context.Background(), networkID, network.InspectOptions{})
	if err != nil {
		return nil, err
	}

	stackResourceID := getStackResourceIDFromLabels(network.Labels, endpointID)
	if stackResourceID != "" {
		return authorization.GetResourceControlByResourceIDAndType(stackResourceID, portainer.StackResourceControl, resourceControls), nil
	}

	return nil, nil
}

// networkListOperation extracts the response as a JSON object, loop through the networks array
// decorate and/or filter the networks based on resource controls before rewriting the response.
func (transport *Transport) networkListOperation(response *http.Response, executor *operationExecutor) error {
	// NetworkList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
	responseArray, err := utils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: networkObjectIdentifier,
		resourceType:                portainer.NetworkResourceControl,
		labelsObjectSelector:        selectorNetworkLabels,
	}

	responseArray, err = transport.applyAccessControlOnResourceList(resourceOperationParameters, responseArray, executor)
	if err != nil {
		return err
	}

	return utils.RewriteResponse(response, responseArray, http.StatusOK)
}

// networkInspectOperation extracts the response as a JSON object, verify that the user
// has access to the network based on resource control and either rewrite an access denied response or a decorated network.
func (transport *Transport) networkInspectOperation(response *http.Response, executor *operationExecutor) error {
	// NetworkInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/NetworkInspect
	responseObject, err := utils.GetResponseAsJSONObject(response)
	if err != nil {
		return err
	}

	resourceOperationParameters := &resourceOperationParameters{
		resourceIdentifierAttribute: networkObjectIdentifier,
		resourceType:                portainer.NetworkResourceControl,
		labelsObjectSelector:        selectorNetworkLabels,
	}

	return transport.applyAccessControlOnResource(resourceOperationParameters, responseObject, response, executor)
}

// findSystemNetworkResourceControl will check if the network object is a system network
// and will return a system resource control if that's the case.
func findSystemNetworkResourceControl(networkObject map[string]any) *portainer.ResourceControl {
	if networkObject[networkObjectName] == nil {
		return nil
	}

	networkID := networkObject[networkObjectIdentifier].(string)
	networkName := networkObject[networkObjectName].(string)

	if slices.Contains(stackutils.SystemNetworkNames, networkName) {
		return authorization.NewSystemResourceControl(networkID, portainer.NetworkResourceControl)
	}

	return nil
}

// selectorNetworkLabels retrieve the labels object associated to the network object.
// Labels are available under the "Labels" property.
// API schema references:
// https://docs.docker.com/engine/api/v1.28/#operation/NetworkInspect
// https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
func selectorNetworkLabels(responseObject map[string]any) map[string]any {
	return utils.GetJSONObject(responseObject, "Labels")
}
