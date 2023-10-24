package request

import (
	"net/http"

	"github.com/pkg/errors"
	"github.com/segmentio/encoding/json"
)

// PayloadValidation is an interface used to validate the payload of a request.
type PayloadValidation interface {
	Validate(request *http.Request) error
}

// DecodeAndValidateJSONPayload decodes the body of the request into an object
// implementing the PayloadValidation interface.
// It also triggers a validation of object content.
func DecodeAndValidateJSONPayload(request *http.Request, v PayloadValidation) error {
	if err := json.NewDecoder(request.Body).Decode(v); err != nil {
		return err
	}
	return v.Validate(request)
}

// GetPayload decodes the body of the request into an object implementing the PayloadValidation interface.
func GetPayload[T any, PT interface {
	*T
	Validate(request *http.Request) error
}](r *http.Request) (PT, error) {
	p := PT(new(T))

	err := DecodeAndValidateJSONPayload(r, p)
	if err != nil {
		return nil, errors.WithMessage(err, "Invalid request payload")
	}
	return p, nil
}
