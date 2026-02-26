package authorization

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

// Test role fixtures
// In Portainer's role system, higher priority numbers = higher priority (more powerful).
// Order from highest to lowest: Read-only (4), Helpdesk (3), Operator (2), Admin (1).
var (
	roleAdmin = portainer.Role{
		ID:             1,
		Name:           "Environment Administrator",
		Priority:       1,
		Authorizations: portainer.Authorizations{"admin": true},
	}
	roleOperator = portainer.Role{
		ID:             2,
		Name:           "Operator",
		Priority:       2,
		Authorizations: portainer.Authorizations{"operator": true},
	}
	roleHelpdesk = portainer.Role{
		ID:             3,
		Name:           "Helpdesk",
		Priority:       3,
		Authorizations: portainer.Authorizations{"helpdesk": true},
	}
	roleReadOnly = portainer.Role{
		ID:             4,
		Name:           "Read-only",
		Priority:       4,
		Authorizations: portainer.Authorizations{"readonly": true},
	}

	allRoles = []portainer.Role{roleAdmin, roleOperator, roleHelpdesk, roleReadOnly}
)

func TestComputeBaseRole_UserEndpointAccess(t *testing.T) {
	is := assert.New(t)

	user := &portainer.User{ID: 1}
	endpoint := &portainer.Endpoint{
		ID:      1,
		GroupID: 1,
		UserAccessPolicies: portainer.UserAccessPolicies{
			1: {RoleID: roleOperator.ID},
		},
	}

	input := ResolverInput{
		User:            user,
		Endpoint:        endpoint,
		EndpointGroup:   portainer.EndpointGroup{},
		UserMemberships: []portainer.TeamMembership{},
		Roles:           allRoles,
	}

	role := ComputeBaseRole(input)

	is.NotNil(role)
	is.Equal(roleOperator.ID, role.ID)
	is.Equal("Operator", role.Name)
}

func TestComputeBaseRole_UserGroupAccess(t *testing.T) {
	is := assert.New(t)

	user := &portainer.User{ID: 1}
	endpoint := &portainer.Endpoint{
		ID:                 1,
		GroupID:            10,
		UserAccessPolicies: portainer.UserAccessPolicies{}, // No direct access
	}
	groups := []portainer.EndpointGroup{
		{
			ID: 10,
			UserAccessPolicies: portainer.UserAccessPolicies{
				1: {RoleID: roleHelpdesk.ID}, // User has access via group
			},
		},
	}

	input := ResolverInput{
		User:            user,
		Endpoint:        endpoint,
		EndpointGroup:   groups[0],
		UserMemberships: []portainer.TeamMembership{},
		Roles:           allRoles,
	}

	role := ComputeBaseRole(input)

	is.NotNil(role)
	is.Equal(roleHelpdesk.ID, role.ID)
	is.Equal("Helpdesk", role.Name)
}

func TestComputeBaseRole_TeamEndpointAccess(t *testing.T) {
	is := assert.New(t)

	user := &portainer.User{ID: 1}
	endpoint := &portainer.Endpoint{
		ID:                 1,
		GroupID:            1,
		UserAccessPolicies: portainer.UserAccessPolicies{}, // No user access
		TeamAccessPolicies: portainer.TeamAccessPolicies{
			100: {RoleID: roleReadOnly.ID}, // Team 100 has access
		},
	}
	memberships := []portainer.TeamMembership{
		{UserID: 1, TeamID: 100}, // User is in team 100
	}

	input := ResolverInput{
		User:            user,
		Endpoint:        endpoint,
		EndpointGroup:   portainer.EndpointGroup{},
		UserMemberships: memberships,
		Roles:           allRoles,
	}

	role := ComputeBaseRole(input)

	is.NotNil(role)
	is.Equal(roleReadOnly.ID, role.ID)
}

func TestComputeBaseRole_TeamGroupAccess(t *testing.T) {
	is := assert.New(t)

	user := &portainer.User{ID: 1}
	endpoint := &portainer.Endpoint{
		ID:                 1,
		GroupID:            10,
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{}, // No direct team access
	}
	groups := []portainer.EndpointGroup{
		{
			ID:                 10,
			UserAccessPolicies: portainer.UserAccessPolicies{},
			TeamAccessPolicies: portainer.TeamAccessPolicies{
				100: {RoleID: roleOperator.ID}, // Team 100 has group access
			},
		},
	}
	memberships := []portainer.TeamMembership{
		{UserID: 1, TeamID: 100},
	}

	input := ResolverInput{
		User:            user,
		Endpoint:        endpoint,
		EndpointGroup:   groups[0],
		UserMemberships: memberships,
		Roles:           allRoles,
	}

	role := ComputeBaseRole(input)

	is.NotNil(role)
	is.Equal(roleOperator.ID, role.ID)
}

func TestComputeBaseRole_Precedence(t *testing.T) {
	is := assert.New(t)

	t.Run("User endpoint access takes precedence over group access", func(t *testing.T) {
		user := &portainer.User{ID: 1}
		endpoint := &portainer.Endpoint{
			ID:      1,
			GroupID: 10,
			UserAccessPolicies: portainer.UserAccessPolicies{
				1: {RoleID: roleOperator.ID}, // Direct access
			},
		}
		groups := []portainer.EndpointGroup{
			{
				ID: 10,
				UserAccessPolicies: portainer.UserAccessPolicies{
					1: {RoleID: roleAdmin.ID}, // Group access (higher role, but lower precedence)
				},
			},
		}

		input := ResolverInput{
			User:          user,
			Endpoint:      endpoint,
			EndpointGroup: groups[0],
			Roles:         allRoles,
		}

		role := ComputeBaseRole(input)
		is.NotNil(role)
		is.Equal(roleOperator.ID, role.ID, "Direct endpoint access should take precedence")
	})

	t.Run("User access takes precedence over team access", func(t *testing.T) {
		user := &portainer.User{ID: 1}
		endpoint := &portainer.Endpoint{
			ID:      1,
			GroupID: 1,
			UserAccessPolicies: portainer.UserAccessPolicies{
				1: {RoleID: roleHelpdesk.ID},
			},
			TeamAccessPolicies: portainer.TeamAccessPolicies{
				100: {RoleID: roleAdmin.ID}, // Team has higher role
			},
		}
		memberships := []portainer.TeamMembership{
			{UserID: 1, TeamID: 100},
		}

		input := ResolverInput{
			User:            user,
			Endpoint:        endpoint,
			UserMemberships: memberships,
			Roles:           allRoles,
		}

		role := ComputeBaseRole(input)
		is.NotNil(role)
		is.Equal(roleHelpdesk.ID, role.ID, "User access should take precedence over team access")
	})

	t.Run("Team endpoint access takes precedence over team group access", func(t *testing.T) {
		user := &portainer.User{ID: 1}
		endpoint := &portainer.Endpoint{
			ID:      1,
			GroupID: 10,
			TeamAccessPolicies: portainer.TeamAccessPolicies{
				100: {RoleID: roleReadOnly.ID}, // Direct team endpoint access
			},
		}
		groups := []portainer.EndpointGroup{
			{
				ID: 10,
				TeamAccessPolicies: portainer.TeamAccessPolicies{
					100: {RoleID: roleAdmin.ID}, // Team group access (higher role)
				},
			},
		}
		memberships := []portainer.TeamMembership{
			{UserID: 1, TeamID: 100},
		}

		input := ResolverInput{
			User:            user,
			Endpoint:        endpoint,
			EndpointGroup:   groups[0],
			UserMemberships: memberships,
			Roles:           allRoles,
		}

		role := ComputeBaseRole(input)
		is.NotNil(role)
		is.Equal(roleReadOnly.ID, role.ID, "Team endpoint access should take precedence over team group access")
	})
}

func TestComputeBaseRole_NoAccess(t *testing.T) {
	is := assert.New(t)

	user := &portainer.User{ID: 1}
	endpoint := &portainer.Endpoint{
		ID:                 1,
		GroupID:            10,
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
	}
	groups := []portainer.EndpointGroup{
		{
			ID:                 10,
			UserAccessPolicies: portainer.UserAccessPolicies{},
			TeamAccessPolicies: portainer.TeamAccessPolicies{},
		},
	}

	input := ResolverInput{
		User:            user,
		Endpoint:        endpoint,
		EndpointGroup:   groups[0],
		UserMemberships: []portainer.TeamMembership{},
		Roles:           allRoles,
	}

	role := ComputeBaseRole(input)
	is.Nil(role)
}

func TestComputeBaseRole_MultipleTeams_HighestPriorityWins(t *testing.T) {
	is := assert.New(t)

	user := &portainer.User{ID: 1}
	endpoint := &portainer.Endpoint{
		ID:      1,
		GroupID: 1,
		TeamAccessPolicies: portainer.TeamAccessPolicies{
			100: {RoleID: roleReadOnly.ID}, // Highest priority (4)
			200: {RoleID: roleAdmin.ID},    // Lowest priority (1)
			300: {RoleID: roleOperator.ID}, // Medium priority (2)
		},
	}
	memberships := []portainer.TeamMembership{
		{UserID: 1, TeamID: 100},
		{UserID: 1, TeamID: 200},
		{UserID: 1, TeamID: 300},
	}

	input := ResolverInput{
		User:            user,
		Endpoint:        endpoint,
		EndpointGroup:   portainer.EndpointGroup{},
		UserMemberships: memberships,
		Roles:           allRoles,
	}

	role := ComputeBaseRole(input)

	is.NotNil(role)
	is.Equal(roleReadOnly.ID, role.ID, "Highest priority role should be selected when user is in multiple teams")
}

func TestResolveUserEndpointAccess(t *testing.T) {
	is := assert.New(t)

	t.Run("Returns resolved access with role and authorizations", func(t *testing.T) {
		user := &portainer.User{ID: 1}
		endpoint := &portainer.Endpoint{
			ID: 1,
			UserAccessPolicies: portainer.UserAccessPolicies{
				1: {RoleID: roleOperator.ID},
			},
		}

		input := ResolverInput{
			User:     user,
			Endpoint: endpoint,
			Roles:    allRoles,
		}

		access := ResolveUserEndpointAccess(input)

		is.NotNil(access)
		is.Equal(roleOperator.ID, access.Role.ID)
		is.True(access.Authorizations["operator"])
	})

	t.Run("Returns nil when no access", func(t *testing.T) {
		user := &portainer.User{ID: 1}
		endpoint := &portainer.Endpoint{ID: 1}

		input := ResolverInput{
			User:     user,
			Endpoint: endpoint,
			Roles:    allRoles,
		}

		access := ResolveUserEndpointAccess(input)
		is.Nil(access)
	})
}

func TestFindRoleByID(t *testing.T) {
	is := assert.New(t)

	t.Run("Finds existing role", func(t *testing.T) {
		role := FindRoleByID(roleOperator.ID, allRoles)
		is.NotNil(role)
		is.Equal(roleOperator.ID, role.ID)
	})

	t.Run("Returns nil for non-existent role", func(t *testing.T) {
		role := FindRoleByID(999, allRoles)
		is.Nil(role)
	})

	t.Run("Returns nil for empty roles slice", func(t *testing.T) {
		role := FindRoleByID(1, []portainer.Role{})
		is.Nil(role)
	})
}

func TestGetHighestPriorityRole(t *testing.T) {
	is := assert.New(t)

	t.Run("Returns nil for empty slice", func(t *testing.T) {
		result := GetHighestPriorityRole([]*portainer.Role{})
		is.Nil(result)
	})

	t.Run("Returns single role", func(t *testing.T) {
		result := GetHighestPriorityRole([]*portainer.Role{&roleOperator})
		is.Equal(roleOperator.ID, result.ID)
	})

	t.Run("Returns highest priority from multiple roles", func(t *testing.T) {
		result := GetHighestPriorityRole([]*portainer.Role{&roleReadOnly, &roleAdmin, &roleOperator})
		is.Equal(roleReadOnly.ID, result.ID)
	})
}
