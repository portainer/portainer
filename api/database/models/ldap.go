package models

type (
	// LDAPSettings represents the settings used to connect to a LDAP server
	LDAPSettings struct {
		// Enable this option if the server is configured for Anonymous access. When enabled, ReaderDN and Password will not be used
		AnonymousMode bool `json:"AnonymousMode" example:"true" validate:"validate_bool"`
		// Account that will be used to search for users
		ReaderDN string `json:"ReaderDN" example:"cn=readonly-account,dc=ldap,dc=domain,dc=tld" validate:"required_if=AnonymousMode false"`
		// Password of the account that will be used to search users
		Password string `json:"Password,omitempty" example:"readonly-password" validate:"required_if=AnonymousMode false"`
		// URL or IP address of the LDAP server
		URL       string           `json:"URL" example:"myldap.domain.tld:389" validate:"hostname_port"`
		TLSConfig TLSConfiguration `json:"TLSConfig"`
		// Whether LDAP connection should use StartTLS
		StartTLS            bool                      `json:"StartTLS" example:"true"`
		SearchSettings      []LDAPSearchSettings      `json:"SearchSettings"`
		GroupSearchSettings []LDAPGroupSearchSettings `json:"GroupSearchSettings"`
		// Automatically provision users and assign them to matching LDAP group names
		AutoCreateUsers bool `json:"AutoCreateUsers" example:"true"`
	}

	// LDAPUser represents a LDAP user
	LDAPUser struct {
		Name   string
		Groups []string
	}

	// LDAPGroupSearchSettings represents settings used to search for groups in a LDAP server
	LDAPGroupSearchSettings struct {
		// The distinguished name of the element from which the LDAP server will search for groups
		GroupBaseDN string `json:"GroupBaseDN" example:"dc=ldap,dc=domain,dc=tld"`
		// The LDAP search filter used to select group elements, optional
		GroupFilter string `json:"GroupFilter" example:"(objectClass=account"`
		// LDAP attribute which denotes the group membership
		GroupAttribute string `json:"GroupAttribute" example:"member"`
	}

	// LDAPSearchSettings represents settings used to search for users in a LDAP server
	LDAPSearchSettings struct {
		// The distinguished name of the element from which the LDAP server will search for users
		BaseDN string `json:"BaseDN" example:"dc=ldap,dc=domain,dc=tld"`
		// Optional LDAP search filter used to select user elements
		Filter string `json:"Filter" example:"(objectClass=account)"`
		// LDAP attribute which denotes the username
		UserNameAttribute string `json:"UserNameAttribute" example:"uid"`
	}
)
