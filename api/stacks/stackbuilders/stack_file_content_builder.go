package stackbuilders

import (
	"time"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
)

type FileContentMethodStackBuildProcess interface {
	// Set general stack information
	SetGeneralInfo(payload *StackPayload, endpoint *portainer.Endpoint) FileContentMethodStackBuildProcess
	// Set unique stack information, e.g. swarm stack has swarmID, kubernetes stack has namespace
	SetUniqueInfo(payload *StackPayload) FileContentMethodStackBuildProcess
	// Deploy stack based on the configuration
	Deploy(payload *StackPayload, endpoint *portainer.Endpoint) FileContentMethodStackBuildProcess
	// Save the stack information to database
	SaveStack() (*portainer.Stack, *httperror.HandlerError)
	// Get reponse from http request. Use if it is needed
	GetResponse() string
	// Process the file content
	SetFileContent(payload *StackPayload) FileContentMethodStackBuildProcess
}

type FileContentMethodStackBuilder struct {
	StackBuilder
}

func (b *FileContentMethodStackBuilder) SetGeneralInfo(payload *StackPayload, endpoint *portainer.Endpoint) FileContentMethodStackBuildProcess {
	stackID := b.dataStore.Stack().GetNextIdentifier()
	b.stack.ID = portainer.StackID(stackID)
	b.stack.EndpointID = endpoint.ID
	b.stack.Status = portainer.StackStatusActive
	b.stack.CreationDate = time.Now().Unix()
	return b
}

func (b *FileContentMethodStackBuilder) SetUniqueInfo(payload *StackPayload) FileContentMethodStackBuildProcess {

	return b
}

func (b *FileContentMethodStackBuilder) SetFileContent(payload *StackPayload) FileContentMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	return b
}

func (b *FileContentMethodStackBuilder) Deploy(payload *StackPayload, endpoint *portainer.Endpoint) FileContentMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	// Deploy the stack
	err := b.deploymentConfiger.Deploy()
	if err != nil {
		b.err = httperror.InternalServerError(err.Error(), err)
		return b
	}

	return b
}

func (b *FileContentMethodStackBuilder) GetResponse() string {
	return ""
}
