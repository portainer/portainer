package security

import "errors"

var (
	ErrAuthorizationRequired = errors.New("Authorization required for this operation")
	ErrTokenScopeNotAllowed  = errors.New("the token scope is not allowed on this route")
)
