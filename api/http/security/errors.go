package security

import "errors"

var (
	ErrAuthorizationRequired = errors.New("Authorization required for this operation")
)
