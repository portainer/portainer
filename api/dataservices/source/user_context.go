package source

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type UserContext = dataservices.SourceServiceUserContext

type userContext struct {
	id          portainer.UserID
	role        portainer.UserRole
	memberships []portainer.TeamMembership
}

func (uc userContext) ID() portainer.UserID {
	return uc.id
}

func (uc userContext) TeamMemberships() []portainer.TeamMembership {
	return uc.memberships
}

func (uc userContext) IsAdmin() bool {
	return uc.role == portainer.AdministratorRole
}

// Create a new admin context
//
// # THIS FUNCTION MUST NOT BE USED IN A USER-AWARE FLOW, ONLY FOR MIGRATIONS AND TESTS
//
// The only flows outside of migrations/test allowed to use this func is the datastore.Import/Export for sources
func InsecureNewAdminContext() UserContext {
	return NewUserContext(&portainer.User{Role: portainer.AdministratorRole}, []portainer.TeamMembership{})
}

func NewUserContext(user *portainer.User, userMemberships []portainer.TeamMembership) UserContext {
	return userContext{id: user.ID, role: user.Role, memberships: userMemberships}
}
