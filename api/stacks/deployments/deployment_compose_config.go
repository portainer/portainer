package deployments

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

type ComposeStackDeploymentConfig struct {
	stack          *portainer.Stack
	endpoint       *portainer.Endpoint
	registries     []portainer.Registry
	isAdmin        bool
	user           *portainer.User
	forcePullImage bool
	ForceCreate    bool
	FileService    portainer.FileService
	StackDeployer  StackDeployer
}

func CreateComposeStackDeploymentConfig(securityContext *security.RestrictedRequestContext, stack *portainer.Stack, endpoint *portainer.Endpoint, dataStore dataservices.DataStore, fileService portainer.FileService, deployer StackDeployer, forcePullImage, forceCreate bool) (*ComposeStackDeploymentConfig, error) {
	return CreateComposeStackDeploymentConfigTx(dataStore, securityContext, stack, endpoint, fileService, deployer, forcePullImage, forceCreate)
}

// Alternate function that works within a transaction
// We didn't update the original function to use a transaction because it would be a breaking change for many other files.
// Let's do this only where necessary for now. This is also planed to be refactored in the future, but not prioritized right now.
func CreateComposeStackDeploymentConfigTx(tx dataservices.DataStoreTx, securityContext *security.RestrictedRequestContext, stack *portainer.Stack, endpoint *portainer.Endpoint, fileService portainer.FileService, deployer StackDeployer, forcePullImage, forceCreate bool) (*ComposeStackDeploymentConfig, error) {
	user, err := tx.User().Read(securityContext.UserID)
	if err != nil {
		return nil, fmt.Errorf("unable to load user information from the database: %w", err)
	}

	registries, err := tx.Registry().ReadAll()
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve registries from the database: %w", err)
	}

	filteredRegistries := security.FilterRegistries(registries, user, securityContext.UserMemberships, endpoint.ID)

	config := &ComposeStackDeploymentConfig{
		stack:          stack,
		endpoint:       endpoint,
		registries:     filteredRegistries,
		isAdmin:        securityContext.IsAdmin,
		user:           user,
		forcePullImage: forcePullImage,
		ForceCreate:    forceCreate,
		FileService:    fileService,
		StackDeployer:  deployer,
	}

	return config, nil
}

func (config *ComposeStackDeploymentConfig) GetUsername() string {
	if config.user != nil {
		return config.user.Username
	}
	return ""
}

func (config *ComposeStackDeploymentConfig) Deploy() error {
	if config.FileService == nil || config.StackDeployer == nil {
		log.Debug().Msg("file service or stack deployer is not initialized")
		return errors.New("file service or stack deployer cannot be nil")
	}

	isAdminOrEndpointAdmin, err := stackutils.UserIsAdminOrEndpointAdmin(config.user, config.endpoint.ID)
	if err != nil {
		return errors.Wrap(err, "failed to validate user admin privileges")
	}

	securitySettings := &config.endpoint.SecuritySettings

	if !isAdminOrEndpointAdmin {
		if err := stackutils.ValidateStackFiles(config.stack, securitySettings, config.FileService); err != nil {
			return err
		}
	}

	if stackutils.IsRelativePathStack(config.stack) {
		return config.StackDeployer.DeployRemoteComposeStack(config.stack, config.endpoint, config.registries, config.forcePullImage, config.ForceCreate)
	}

	return config.StackDeployer.DeployComposeStack(config.stack, config.endpoint, config.registries, config.forcePullImage, config.ForceCreate)
}

func (config *ComposeStackDeploymentConfig) GetResponse() string {
	return ""
}
