package errors

import "errors"

var (
	// ErrBinaryNotFound is returned when docker-compose binary is not found
	ErrBinaryNotFound = errors.New("docker-compose binary not found")
)
