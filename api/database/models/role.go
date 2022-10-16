package models

type (
	// Role represents a set of authorizations that can be associated to a user or
	// to a team.
	Role struct {
		// Role Identifier
		ID RoleID `json:"Id" example:"1"`
		// Role name
		Name string `json:"Name" example:"HelpDesk"`
		// Role description
		Description string `json:"Description" example:"Read-only access of all resources in an environment(endpoint)"`
		// Authorizations associated to a role
		Authorizations Authorizations `json:"Authorizations"`
		Priority       int            `json:"Priority"`
	}

	// RoleID represents a role identifier
	RoleID int
)
