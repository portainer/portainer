package rbacutils

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/endpointutils"
)

// IsAdmin checks if user is a Portainer Admin
func IsAdmin(role portainer.UserRole) bool {
	return role == portainer.AdministratorRole
}

// IsAdminOrEdgeAdmin checks if current user is a Portainer Admin, or edge admin of environment
func IsAdminOrEdgeAdmin(role portainer.UserRole, endpoint *portainer.Endpoint) bool {
	return IsAdmin(role) || IsEdgeAdmin(role, endpoint)
}

// IsEdgeAdmin checks if current user is edge admin of environment.
// It doesn't check for portainer admin.
func IsEdgeAdmin(role portainer.UserRole, endpoint *portainer.Endpoint) bool {
	return role == portainer.EdgeAdminRole && (endpoint == nil || endpointutils.IsEdgeEndpoint(endpoint))
}

// IsAdminOrEndpointAdmin checks if current request is for an admin, edge admin, or an environment(endpoint) admin
//
// EE-6176 TODO later: move this check to RBAC layer performed before in-handler execution (see usage references of this func)
//
// TODO EE-6627: check usage of function
func IsAdminOrEndpointAdmin(user *portainer.User, endpoint *portainer.Endpoint) bool {
	if user == nil {
		return false
	}
	return IsAdminOrEdgeAdmin(user.Role, endpoint) || (endpoint != nil && IsEndpointAdmin(user, endpoint.ID))
}

// check if user is endpoint admin of endpoint
func IsEndpointAdmin(user *portainer.User, endpointId portainer.EndpointID) bool {
	if user == nil {
		return false
	}

	hasResourceAccess, ok := user.EndpointAuthorizations[endpointId][portainer.EndpointResourcesAccess]
	return ok && hasResourceAccess
}

// RoleFromUser returns the role of the user
func RoleFromUser(user *portainer.User) portainer.UserRole {
	if user == nil {
		return portainer.UserRole(0)
	}

	return user.Role
}
