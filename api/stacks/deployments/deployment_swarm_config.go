package deployments

import (
	"fmt"
	"log"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/stackutils"
)

type SwarmStackDeploymentConfig struct {
	stack         *portainer.Stack
	endpoint      *portainer.Endpoint
	registries    []portainer.Registry
	prune         bool
	isAdmin       bool
	user          *portainer.User
	pullImage     bool
	FileService   portainer.FileService
	StackDeployer StackDeployer
}

func CreateSwarmStackDeploymentConfig(securityContext *security.RestrictedRequestContext, stack *portainer.Stack, endpoint *portainer.Endpoint, dataStore dataservices.DataStore, fileService portainer.FileService, deployer StackDeployer, prune bool, pullImage bool) (*SwarmStackDeploymentConfig, error) {
	user, err := dataStore.User().Read(securityContext.UserID)
	if err != nil {
		return nil, fmt.Errorf("unable to load user information from the database: %w", err)
	}

	registries, err := dataStore.Registry().ReadAll()
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve registries from the database: %w", err)
	}

	filteredRegistries := security.FilterRegistries(registries, user, securityContext.UserMemberships, endpoint.ID)

	config := &SwarmStackDeploymentConfig{
		stack:         stack,
		endpoint:      endpoint,
		registries:    filteredRegistries,
		prune:         prune,
		isAdmin:       securityContext.IsAdmin,
		user:          user,
		pullImage:     pullImage,
		FileService:   fileService,
		StackDeployer: deployer,
	}

	return config, nil
}

func (config *SwarmStackDeploymentConfig) GetUsername() string {
	if config.user != nil {
		return config.user.Username
	}
	return ""
}

func (config *SwarmStackDeploymentConfig) Deploy() error {
	if config.FileService == nil || config.StackDeployer == nil {
		log.Println("[deployment, swarm] file service or stack deployer is not initialised")
		return errors.New("file service or stack deployer cannot be nil")
	}

	isAdminOrEndpointAdmin, err := stackutils.UserIsAdminOrEndpointAdmin(config.user, config.endpoint.ID)
	if err != nil {
		return errors.Wrap(err, "failed to validate user admin privileges")
	}

	settings := &config.endpoint.SecuritySettings

	if !settings.AllowBindMountsForRegularUsers && !isAdminOrEndpointAdmin {
		err = stackutils.ValidateStackFiles(config.stack, settings, config.FileService)
		if err != nil {
			return err
		}
	}

	if stackutils.IsRelativePathStack(config.stack) {
		return config.StackDeployer.DeployRemoteSwarmStack(config.stack, config.endpoint, config.registries, config.prune, config.pullImage)
	}

	return config.StackDeployer.DeploySwarmStack(config.stack, config.endpoint, config.registries, config.prune, config.pullImage)
}

func (config *SwarmStackDeploymentConfig) GetResponse() string {
	return ""
}
