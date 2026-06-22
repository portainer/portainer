package source

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type userContext = dataservices.SourceServiceUserContext

// Create a new admin context
//
// # THIS FUNCTION MUST NOT BE USED IN A USER-AWARE FLOW, ONLY FOR MIGRATIONS AND TESTS
//
// The only flows outside of migrations/test allowed to use this func is the datastore.Import/Export for sources
func InsecureNewAdminContext() *userContext {
	return NewUserContext(&portainer.User{Role: portainer.AdministratorRole}, []portainer.TeamMembership{})
}

func NewUserContext(user *portainer.User, userMemberships []portainer.TeamMembership) *userContext {
	return &userContext{User: user, UserMemberships: userMemberships}
}
