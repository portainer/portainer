package errors

import "errors"

type InvalidPayloadError struct {
	msg string
}

func (e *InvalidPayloadError) Error() string {
	return e.msg
}

func NewInvalidPayloadError(msg string) *InvalidPayloadError {
	return &InvalidPayloadError{msg: msg}
}

func IsInvalidPayloadError(err error) bool {
	var payloadError *InvalidPayloadError
	return errors.As(err, &payloadError)
}
