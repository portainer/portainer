package deployments

import (
	"errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/docker/docker/client"
)

func ValidateStackForUser(stack *portainer.Stack, endpoint *portainer.Endpoint, user *portainer.User, deployer BaseStackDeployer, fileService portainer.FileService) error {
	if stack.Type != portainer.DockerComposeStack && stack.Type != portainer.DockerSwarmStack {
		return nil
	}

	if stackutils.UserIsAdminOrEndpointAdmin(user) {
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
