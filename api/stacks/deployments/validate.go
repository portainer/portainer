package deployments

import (
	"errors"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/docker/docker/client"
)

func ValidateStackForUser(stack *portainer.Stack, endpoint *portainer.Endpoint, user *portainer.User, deployer BaseStackDeployer, fileService portainer.FileService) error {
	if stack.Type != portainer.DockerComposeStack && stack.Type != portainer.DockerSwarmStack {
		return nil
	}

	isAdminOrEndpointAdmin, err := stackutils.UserIsAdminOrEndpointAdmin(user, endpoint.ID)
	if err != nil {
		return fmt.Errorf("failed to validate user admin privileges: %w", err)
	}

	if isAdminOrEndpointAdmin {
		return nil
	}

	if fileService == nil {
		return errors.New("file service cannot be nil")
	}

	var dockerClient *client.Client

	if factory := deployer.GetDockerClientFactory(); factory != nil {
		var err error

		dockerClient, err = factory.CreateClient(endpoint, "", nil)
		if err != nil {
			return err
		}
		defer logs.CloseAndLogErr(dockerClient)
	}

	return stackutils.ValidateStackFiles(stack, &endpoint.SecuritySettings, fileService, dockerClient)
}
