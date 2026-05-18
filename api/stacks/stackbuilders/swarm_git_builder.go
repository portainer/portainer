package stackbuilders

import (
	"context"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks/deployments"
)

type SwarmStackGitBuilder struct {
	GitMethodStackBuilder
	SecurityContext *security.RestrictedRequestContext
}

// CreateSwarmStackGitBuilder creates a builder for the swarm stack that will be deployed by git repository method
func CreateSwarmStackGitBuilder(securityContext *security.RestrictedRequestContext,
	dataStore dataservices.DataStore,
	fileService portainer.FileService,
	gitService portainer.GitService,
	scheduler *scheduler.Scheduler,
	stackDeployer deployments.StackDeployer) *SwarmStackGitBuilder {

	return &SwarmStackGitBuilder{
		GitMethodStackBuilder: GitMethodStackBuilder{
			StackBuilder: CreateStackBuilder(dataStore, fileService, stackDeployer),
			gitService:   gitService,
			scheduler:    scheduler,
		},
		SecurityContext: securityContext,
	}
}

func (b *SwarmStackGitBuilder) prepare(ctx context.Context, payload *StackPayload, userID portainer.UserID) error {
	b.stack.Name = payload.Name
	b.stack.Type = portainer.DockerSwarmStack
	b.stack.SwarmID = payload.SwarmID
	b.stack.EntryPoint = payload.ComposeFile
	b.stack.FromAppTemplate = payload.FromAppTemplate
	b.stack.Env = payload.Env

	return b.GitMethodStackBuilder.prepare(ctx, payload, userID)
}

// deploy creates deployment configuration for swarm stack
func (b *SwarmStackGitBuilder) deploy(ctx context.Context, endpoint *portainer.Endpoint) error {
	if err := b.initSwarmDeployment(b.SecurityContext, endpoint); err != nil {
		return err
	}

	return b.deploymentConfiger.Deploy(ctx)
}
