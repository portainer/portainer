package stackbuilders

import (
	"context"
	"fmt"
	"strconv"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/rs/zerolog/log"
)

type StackBuilder struct {
	stack              *portainer.Stack
	endpoint           *portainer.Endpoint
	dataStore          dataservices.DataStore
	fileService        portainer.FileService
	stackDeployer      deployments.StackDeployer
	deploymentConfiger deployments.StackDeploymentConfiger
	doCleanUp          bool
}

func CreateStackBuilder(dataStore dataservices.DataStore, fileService portainer.FileService, deployer deployments.StackDeployer) StackBuilder {
	return StackBuilder{
		stack:         &portainer.Stack{},
		dataStore:     dataStore,
		fileService:   fileService,
		stackDeployer: deployer,
		doCleanUp:     true,
	}
}

func (b *StackBuilder) setGeneralInfo(_ *StackPayload, endpoint *portainer.Endpoint) {
	b.endpoint = endpoint
	stackID := b.dataStore.Stack().GetNextIdentifier()
	b.stack.ID = portainer.StackID(stackID)
	b.stack.EndpointID = endpoint.ID
	now := time.Now().Unix()
	b.stack.CreationDate = now
	stackutils.PrepareStackStatusForDeployment(b.stack)
}

func (b *StackBuilder) deploy(ctx context.Context, _ *portainer.Endpoint) error {
	return b.deploymentConfiger.Deploy(ctx)
}

func (b *StackBuilder) postDeploy(_ context.Context, _ *portainer.Stack) error { return nil }

func (b *StackBuilder) saveStack() (*portainer.Stack, error) {
	defer func() { _ = b.cleanUp() }()

	if err := b.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := tx.Stack().Create(b.stack); err != nil {
			return fmt.Errorf("Unable to persist the stack inside the database: %w", err)
		}

		return nil
	}); err != nil {
		return nil, err
	}

	b.doCleanUp = false

	return b.stack, nil
}

func (b *StackBuilder) cleanUp() error {
	if !b.doCleanUp {
		return nil
	}

	if err := b.fileService.RemoveDirectory(b.stack.ProjectPath); err != nil {
		log.Error().Err(err).Msg("unable to cleanup stack creation")
	}

	return nil
}

func (b *StackBuilder) initCreatedBy(userID portainer.UserID) error {
	return b.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		user, err := tx.User().Read(userID)
		if err != nil {
			return fmt.Errorf("failed to find stack author: %w", err)
		}
		b.stack.CreatedBy = user.Username
		return nil
	})
}

func (b *StackBuilder) storeStackFile(content []byte) error {
	stackFolder := strconv.Itoa(int(b.stack.ID))
	projectPath, err := b.fileService.StoreStackFileFromBytes(stackFolder, b.stack.EntryPoint, content)
	if err != nil {
		return err
	}

	b.stack.ProjectPath = projectPath

	return nil
}

func (b *StackBuilder) initComposeDeployment(secCtx *security.RestrictedRequestContext, endpoint *portainer.Endpoint) error {
	config, err := deployments.CreateComposeStackDeploymentConfigTx(b.dataStore, secCtx, b.stack, endpoint, b.fileService, b.stackDeployer, false, false, false)
	if err != nil {
		return fmt.Errorf("failed to create compose deployment config: %w", err)
	}

	b.deploymentConfiger = config

	return nil
}

func (b *StackBuilder) initSwarmDeployment(secCtx *security.RestrictedRequestContext, endpoint *portainer.Endpoint) error {
	config, err := deployments.CreateSwarmStackDeploymentConfigTx(b.dataStore, secCtx, b.stack, endpoint, b.fileService, b.stackDeployer, false, true)
	if err != nil {
		return fmt.Errorf("failed to create swarm deployment config: %w", err)
	}

	b.deploymentConfiger = config

	return nil
}
