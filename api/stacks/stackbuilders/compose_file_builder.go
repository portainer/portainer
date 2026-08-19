package stackbuilders

import (
	"context"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/deployments"
)

type ComposeStackFileBuilder struct {
	StackBuilder
	SecurityContext *security.RestrictedRequestContext
}

// CreateComposeStackFileBuilder creates a builder for compose stacks deployed from a file (either uploaded or provided as text content).
func CreateComposeStackFileBuilder(securityContext *security.RestrictedRequestContext,
	dataStore dataservices.DataStore,
	fileService portainer.FileService,
	stackDeployer deployments.StackDeployer) *ComposeStackFileBuilder {

	return &ComposeStackFileBuilder{
		StackBuilder:    CreateStackBuilder(dataStore, fileService, stackDeployer),
		SecurityContext: securityContext,
	}
}

func (b *ComposeStackFileBuilder) prepare(_ context.Context, payload *StackPayload, userID portainer.UserID) error {
	b.stack.Name = payload.Name
	b.stack.Type = portainer.DockerComposeStack
	b.stack.EntryPoint = filesystem.ComposeFileDefaultName
	b.stack.Env = payload.Env
	b.stack.FromAppTemplate = payload.FromAppTemplate

	if err := b.initCreatedBy(userID); err != nil {
		return err
	}

	return b.storeStackFile(payload.StackFileContent)
}

func (b *ComposeStackFileBuilder) deploy(ctx context.Context, endpoint *portainer.Endpoint) error {
	if err := b.initComposeDeployment(b.SecurityContext, endpoint); err != nil {
		return err
	}

	return b.deploymentConfiger.Deploy(ctx)
}
