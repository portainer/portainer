package stackbuilders

import (
	"strconv"
	"time"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
)

type FileUploadMethodStackBuildProcess interface {
	// Set general stack information
	SetGeneralInfo(payload *StackPayload, endpoint *portainer.Endpoint) FileUploadMethodStackBuildProcess
	// Set unique stack information, e.g. swarm stack has swarmID, kubernetes stack has namespace
	SetUniqueInfo(payload *StackPayload) FileUploadMethodStackBuildProcess
	// Deploy stack based on the configuration
	Deploy(payload *StackPayload, endpoint *portainer.Endpoint) FileUploadMethodStackBuildProcess
	// Save the stack information to database
	SaveStack() (*portainer.Stack, *httperror.HandlerError)
	// Get reponse from http request. Use if it is needed
	GetResponse() string
	// Process the upload file
	SetUploadedFile(payload *StackPayload) FileUploadMethodStackBuildProcess
}

type FileUploadMethodStackBuilder struct {
	StackBuilder
}

func (b *FileUploadMethodStackBuilder) SetGeneralInfo(payload *StackPayload, endpoint *portainer.Endpoint) FileUploadMethodStackBuildProcess {
	stackID := b.dataStore.Stack().GetNextIdentifier()
	b.stack.ID = portainer.StackID(stackID)
	b.stack.EndpointID = endpoint.ID
	b.stack.Status = portainer.StackStatusActive
	b.stack.CreationDate = time.Now().Unix()
	return b
}

func (b *FileUploadMethodStackBuilder) SetUniqueInfo(payload *StackPayload) FileUploadMethodStackBuildProcess {

	return b
}

func (b *FileUploadMethodStackBuilder) SetUploadedFile(payload *StackPayload) FileUploadMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	stackFolder := strconv.Itoa(int(b.stack.ID))
	projectPath, err := b.fileService.StoreStackFileFromBytes(stackFolder, b.stack.EntryPoint, payload.StackFileContentBytes)
	if err != nil {
		b.err = httperror.InternalServerError("Unable to persist Compose file on disk", err)
		return b
	}
	b.stack.ProjectPath = projectPath

	return b
}

func (b *FileUploadMethodStackBuilder) Deploy(payload *StackPayload, endpoint *portainer.Endpoint) FileUploadMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	// Deploy the stack
	err := b.deploymentConfiger.Deploy()
	if err != nil {
		b.err = httperror.InternalServerError(err.Error(), err)
		return b
	}

	b.doCleanUp = false
	return b
}

func (b *FileUploadMethodStackBuilder) GetResponse() string {
	return ""
}
