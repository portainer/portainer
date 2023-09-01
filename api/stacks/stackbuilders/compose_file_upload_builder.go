package stackbuilders

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/deployments"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
)

type ComposeStackFileUploadBuilder struct {
	FileUploadMethodStackBuilder
	SecurityContext *security.RestrictedRequestContext
}

// CreateComposeStackFileUploadBuilder creates a builder for the compose stack (docker standalone) that will be deployed by file upload method
func CreateComposeStackFileUploadBuilder(securityContext *security.RestrictedRequestContext,
	dataStore dataservices.DataStore,
	fileService portainer.FileService,
	stackDeployer deployments.StackDeployer) *ComposeStackFileUploadBuilder {

	return &ComposeStackFileUploadBuilder{
		FileUploadMethodStackBuilder: FileUploadMethodStackBuilder{
			StackBuilder: CreateStackBuilder(dataStore, fileService, stackDeployer),
		},
		SecurityContext: securityContext,
	}
}

func (b *ComposeStackFileUploadBuilder) SetGeneralInfo(payload *StackPayload, endpoint *portainer.Endpoint) FileUploadMethodStackBuildProcess {
	b.FileUploadMethodStackBuilder.SetGeneralInfo(payload, endpoint)
	return b
}

func (b *ComposeStackFileUploadBuilder) SetUniqueInfo(payload *StackPayload) FileUploadMethodStackBuildProcess {
	if b.hasError() {
		return b
	}
	b.stack.Name = payload.Name
	b.stack.Type = portainer.DockerComposeStack
	b.stack.EntryPoint = filesystem.ComposeFileDefaultName
	b.stack.Env = payload.Env
	return b
}

func (b *ComposeStackFileUploadBuilder) SetUploadedFile(payload *StackPayload) FileUploadMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	b.FileUploadMethodStackBuilder.SetUploadedFile(payload)

	return b
}

func (b *ComposeStackFileUploadBuilder) Deploy(payload *StackPayload, endpoint *portainer.Endpoint) FileUploadMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	composeDeploymentConfig, err := deployments.CreateComposeStackDeploymentConfig(b.SecurityContext, b.stack, endpoint, b.dataStore, b.fileService, b.stackDeployer, false, false)
	if err != nil {
		b.err = httperror.InternalServerError(err.Error(), err)
		return b
	}

	b.deploymentConfiger = composeDeploymentConfig
	b.stack.CreatedBy = b.deploymentConfiger.GetUsername()

	return b.FileUploadMethodStackBuilder.Deploy(payload, endpoint)
}
