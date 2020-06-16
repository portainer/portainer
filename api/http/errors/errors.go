package errors

import "errors"

// General errors.
var (
	ErrUnauthorized         = errors.New("Unauthorized")
	ErrResourceAccessDenied = errors.New("Access denied to resource")
)
