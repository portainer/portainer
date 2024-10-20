package stackbuilders

import (
	"errors"

	portainer "github.com/portainer/portainer/api"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
)

type StackBuilderDirector struct {
	builder any
}

func NewStackBuilderDirector(b any) *StackBuilderDirector {
	return &StackBuilderDirector{
		builder: b,
	}
}

func (d *StackBuilderDirector) Save(payload *StackPayload, endpoint *portainer.Endpoint) (*portainer.Stack, *httperror.HandlerError) {
	switch builder := d.builder.(type) {
	case FileContentMethodStackBuildProcess:
		return builder.SetGeneralInfo(payload, endpoint).
			SetUniqueInfo(payload).
			SetFileContent(payload).
			SaveStack()
	default:
		return nil, httperror.BadRequest("Invalid value for query parameter. Value must be: string", errors.New(request.ErrInvalidQueryParameter))
	}
}

func (d *StackBuilderDirector) SaveAndDeploy(payload *StackPayload, endpoint *portainer.Endpoint) (*portainer.Stack, *httperror.HandlerError) {

	switch builder := d.builder.(type) {
	case GitMethodStackBuildProcess:
		return builder.SetGeneralInfo(payload, endpoint).
			SetUniqueInfo(payload).
			SetGitRepository(payload).
			Deploy(payload, endpoint).
			SetAutoUpdate(payload).
			SaveStack()

	case FileUploadMethodStackBuildProcess:
		return builder.SetGeneralInfo(payload, endpoint).
			SetUniqueInfo(payload).
			SetUploadedFile(payload).
			Deploy(payload, endpoint).
			SaveStack()

	case FileContentMethodStackBuildProcess:
		return builder.SetGeneralInfo(payload, endpoint).
			SetUniqueInfo(payload).
			SetFileContent(payload).
			Deploy(payload, endpoint).
			SaveStack()

	case UrlMethodStackBuildProcess:
		return builder.SetGeneralInfo(payload, endpoint).
			SetUniqueInfo(payload).
			SetURL(payload).
			Deploy(payload, endpoint).
			SaveStack()
	}

	return nil, httperror.BadRequest("Invalid value for query parameter: method. Value must be one of: string or repository or url or file", errors.New(request.ErrInvalidQueryParameter))
}
