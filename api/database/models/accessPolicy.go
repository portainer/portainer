package models

type (
	// AccessPolicy represent a policy that can be associated to a user or team
	AccessPolicy struct {
		// Role identifier. Reference the role that will be associated to this access policy
		RoleID RoleID `json:"RoleId" example:"1"`
	}
)
