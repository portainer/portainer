package deployments

import (
	"context"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/registryutils"
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
	prune          bool
}

func CreateComposeStackDeploymentConfigTx(tx dataservices.DataStoreTx, securityContext *security.RestrictedRequestContext, stack *portainer.Stack, endpoint *portainer.Endpoint, fileService portainer.FileService, deployer StackDeployer, prune, forcePullImage, forceCreate bool) (*ComposeStackDeploymentConfig, error) {
	user, err := tx.User().Read(securityContext.UserID)
	if err != nil {
		return nil, fmt.Errorf("unable to load user information from the database: %w", err)
	}

	registries, err := tx.Registry().ReadAll()
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve registries from the database: %w", err)
	}

	filteredRegistries := security.FilterRegistries(registries, user, securityContext.UserMemberships, endpoint.ID)

	if err := registryutils.ValidateRegistriesECRTokens(tx, filteredRegistries); err != nil {
		return nil, err
	}

	config := &ComposeStackDeploymentConfig{
		stack:          stack,
		endpoint:       endpoint,
		registries:     filteredRegistries,
		prune:          prune,
		isAdmin:        securityContext.IsAdmin,
		user:           user,
		forcePullImage: forcePullImage,
		ForceCreate:    forceCreate,
		FileService:    fileService,
		StackDeployer:  deployer,
	}

	return config, nil
}

func (config *ComposeStackDeploymentConfig) Deploy(ctx context.Context) error {
	if config.FileService == nil || config.StackDeployer == nil {
		log.Debug().Msg("file service or stack deployer is not initialized")
		return errors.New("file service or stack deployer cannot be nil")
	}

	isAdminOrEndpointAdmin := stackutils.UserIsAdminOrEndpointAdmin(config.user)
	if !isAdminOrEndpointAdmin && config.endpoint != nil {
		if err := stackutils.ValidateStackFiles(config.stack, &config.endpoint.SecuritySettings, config.FileService); err != nil {
			return err
		}
	}

	if stackutils.IsRelativePathStack(config.stack) {
		return config.StackDeployer.DeployRemoteComposeStack(ctx, config.stack, config.endpoint, config.registries, config.prune, config.forcePullImage, config.ForceCreate)
	}

	return config.StackDeployer.DeployComposeStack(ctx, config.stack, config.endpoint, config.registries, config.prune, config.forcePullImage, config.ForceCreate)
}

func (config *ComposeStackDeploymentConfig) Undeploy(ctx context.Context) error {
	if config.StackDeployer == nil {
		log.Debug().Msg("stack deployer is not initialized")
		return errors.New("stack deployer cannot be nil")
	}

	if stackutils.IsRelativePathStack(config.stack) {
		return config.StackDeployer.UndeployRemoteComposeStack(ctx, config.stack, config.endpoint)
	}
	return config.StackDeployer.UndeployComposeStack(ctx, config.stack, config.endpoint)
}

func (config *ComposeStackDeploymentConfig) GetResponse() string {
	return ""
}
