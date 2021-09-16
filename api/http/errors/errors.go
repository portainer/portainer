package errors

import "errors"

var (
	// ErrEndpointAccessDenied Access denied to environment(endpoint) error
	ErrEndpointAccessDenied = errors.New("Access denied to environment")
	// ErrUnauthorized Unauthorized error
	ErrUnauthorized = errors.New("Unauthorized")
	// ErrResourceAccessDenied Access denied to resource error
	ErrResourceAccessDenied = errors.New("Access denied to resource")
)
