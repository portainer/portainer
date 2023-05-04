package errors

import "errors"

type ConflictError struct {
	msg string
}

func (e *ConflictError) Error() string {
	return e.msg
}

func NewConflictError(msg string) *ConflictError {
	return &ConflictError{msg: msg}
}

func IsConflictError(err error) bool {
	var conflictError *ConflictError
	return errors.As(err, &conflictError)
}
