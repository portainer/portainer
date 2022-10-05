package stackbuilders

import (
	"errors"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
)

type StackBuilderDirector struct {
	builder interface{}
}

func NewStackBuilderDirector(b interface{}) *StackBuilderDirector {
	return &StackBuilderDirector{
		builder: b,
	}
}

func (d *StackBuilderDirector) Build(payload *StackPayload, endpoint *portainer.Endpoint) (*portainer.Stack, *httperror.HandlerError) {

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
