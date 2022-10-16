package models

type (
	// Authorization represents an authorization associated to an operation
	Authorization string

	// Authorizations represents a set of authorizations associated to a role
	Authorizations map[Authorization]bool
)
