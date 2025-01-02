package stackbuilders

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/deployments"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
)

type SwarmStackFileUploadBuilder struct {
	FileUploadMethodStackBuilder
	SecurityContext *security.RestrictedRequestContext
}

// CreateSwarmStackFileUploadBuilder creates a builder for the swarm stack that will be deployed by file upload method
func CreateSwarmStackFileUploadBuilder(securityContext *security.RestrictedRequestContext,
	dataStore dataservices.DataStore,
	fileService portainer.FileService,
	stackDeployer deployments.StackDeployer) *SwarmStackFileUploadBuilder {

	return &SwarmStackFileUploadBuilder{
		FileUploadMethodStackBuilder: FileUploadMethodStackBuilder{
			StackBuilder: CreateStackBuilder(dataStore, fileService, stackDeployer),
		},
		SecurityContext: securityContext,
	}
}

func (b *SwarmStackFileUploadBuilder) SetGeneralInfo(payload *StackPayload, endpoint *portainer.Endpoint) FileUploadMethodStackBuildProcess {
	b.FileUploadMethodStackBuilder.SetGeneralInfo(payload, endpoint)

	return b
}

func (b *SwarmStackFileUploadBuilder) SetUniqueInfo(payload *StackPayload) FileUploadMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	b.stack.Name = payload.Name
	b.stack.Type = portainer.DockerSwarmStack
	b.stack.SwarmID = payload.SwarmID
	b.stack.EntryPoint = filesystem.ComposeFileDefaultName
	b.stack.Env = payload.Env

	return b
}

func (b *SwarmStackFileUploadBuilder) SetUploadedFile(payload *StackPayload) FileUploadMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	b.FileUploadMethodStackBuilder.SetUploadedFile(payload)

	return b
}

func (b *SwarmStackFileUploadBuilder) Deploy(payload *StackPayload, endpoint *portainer.Endpoint) FileUploadMethodStackBuildProcess {
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

	return b.FileUploadMethodStackBuilder.Deploy(payload, endpoint)
}
