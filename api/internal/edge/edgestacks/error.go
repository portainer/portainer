package edgestacks

type InvalidPayloadError struct {
	msg string
}

func (e *InvalidPayloadError) Error() string {
	return e.msg
}

func NewInvalidPayloadError(errMsg string) *InvalidPayloadError {
	return &InvalidPayloadError{
		msg: errMsg,
	}
}
