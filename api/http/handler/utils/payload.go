package utils

import (
	"net/http"

	"github.com/pkg/errors"
	"github.com/portainer/libhttp/request"
)

// TODO use libhttp after merge of https://github.com/portainer/libhttp/pull/8
// GetPayload decodes the body of the request into an object implementing the PayloadValidation interface.
func GetPayload[T any, PT interface {
	*T
	Validate(request *http.Request) error
}](r *http.Request) (PT, error) {
	p := PT(new(T))

	err := request.DecodeAndValidateJSONPayload(r, p)
	if err != nil {
		return nil, errors.WithMessage(err, "Invalid request payload")
	}
	return p, nil
}
