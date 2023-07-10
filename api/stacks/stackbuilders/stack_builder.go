package stackbuilders

import (
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/stacks/deployments"

	"github.com/rs/zerolog/log"
)

type StackBuilder struct {
	stack              *portainer.Stack
	dataStore          dataservices.DataStore
	fileService        portainer.FileService
	stackDeployer      deployments.StackDeployer
	deploymentConfiger deployments.StackDeploymentConfiger
	err                *httperror.HandlerError
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

func (b *StackBuilder) SaveStack() (*portainer.Stack, *httperror.HandlerError) {
	defer b.cleanUp()
	if b.hasError() {
		return nil, b.err
	}

	err := b.dataStore.Stack().Create(b.stack)
	if err != nil {
		b.err = httperror.InternalServerError("Unable to persist the stack inside the database", err)
		return nil, b.err
	}

	b.doCleanUp = false

	return b.stack, b.err
}

func (b *StackBuilder) cleanUp() error {
	if !b.doCleanUp {
		return nil
	}

	err := b.fileService.RemoveDirectory(b.stack.ProjectPath)
	if err != nil {
		log.Error().Err(err).Msg("unable to cleanup stack creation")
	}

	return nil
}

func (b *StackBuilder) hasError() bool {
	return b.err != nil
}
