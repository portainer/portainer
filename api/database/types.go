package database

//TODO: as the dependencies get simpler, these should move to their respective dataservices

// EndpointID represents an environment(endpoint) identifier
type EndpointID int

// UserAccessPolicies represent the association of an access policy and a user
type UserAccessPolicies map[UserID]AccessPolicy

// TeamAccessPolicies represent the association of an access policy and a team
type TeamAccessPolicies map[TeamID]AccessPolicy

// TLSConfiguration represents a TLS configuration
type TLSConfiguration struct {
	// Use TLS
	TLS bool `json:"TLS" example:"true"`
	// Skip the verification of the server TLS certificate
	TLSSkipVerify bool `json:"TLSSkipVerify" example:"false"`
	// Path to the TLS CA certificate file
	TLSCACertPath string `json:"TLSCACert,omitempty" example:"/data/tls/ca.pem"`
	// Path to the TLS client certificate file
	TLSCertPath string `json:"TLSCert,omitempty" example:"/data/tls/cert.pem"`
	// Path to the TLS client key file
	TLSKeyPath string `json:"TLSKey,omitempty" example:"/data/tls/key.pem"`
}

// TeamID represents a team identifier
type TeamID int

// UserID represents a user identifier
type UserID int

// AccessPolicy represent a policy that can be associated to a user or team
type AccessPolicy struct {
	// Role identifier. Reference the role that will be associated to this access policy
	RoleID RoleID `json:"RoleId" example:"1"`
}

// RoleID represents a role identifier
type RoleID int
