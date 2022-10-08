package stackbuilders

import (
	httperror "github.com/portainer/libhttp/error"
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

func (b *SwarmStackGitBuilder) SetGeneralInfo(payload *StackPayload, endpoint *portainer.Endpoint) GitMethodStackBuildProcess {
	b.GitMethodStackBuilder.SetGeneralInfo(payload, endpoint)
	return b
}

func (b *SwarmStackGitBuilder) SetUniqueInfo(payload *StackPayload) GitMethodStackBuildProcess {
	if b.hasError() {
		return b
	}
	b.stack.Name = payload.Name
	b.stack.Type = portainer.DockerSwarmStack
	b.stack.SwarmID = payload.SwarmID
	b.stack.EntryPoint = payload.ComposeFile
	b.stack.FromAppTemplate = payload.FromAppTemplate
	b.stack.Env = payload.Env
	return b
}

func (b *SwarmStackGitBuilder) SetGitRepository(payload *StackPayload) GitMethodStackBuildProcess {
	b.GitMethodStackBuilder.SetGitRepository(payload)
	return b
}

// Deploy creates deployment configuration for swarm stack
func (b *SwarmStackGitBuilder) Deploy(payload *StackPayload, endpoint *portainer.Endpoint) GitMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	swarmDeploymentConfig, err := deployments.CreateSwarmStackDeploymentConfig(b.SecurityContext, b.stack, endpoint, b.dataStore, b.fileService, b.stackDeployer, false, true)
	if err != nil {
		b.err = httperror.InternalServerError(err.Error(), err)
		return b
	}

	b.deploymentConfiger = swarmDeploymentConfig
	b.stack.CreatedBy = b.deploymentConfiger.GetUsername()

	return b.GitMethodStackBuilder.Deploy(payload, endpoint)
}

func (b *SwarmStackGitBuilder) SetAutoUpdate(payload *StackPayload) GitMethodStackBuildProcess {
	b.GitMethodStackBuilder.SetAutoUpdate(payload)
	return b
}
