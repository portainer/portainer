package security

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/rs/zerolog/log"
)

// IsAdmin returns true if the logged-in user is an admin
func IsAdmin(request *http.Request) (bool, error) {
	tokenData, err := RetrieveTokenData(request)
	if err != nil {
		return false, err
	}

	return tokenData.Role == portainer.AdministratorRole, nil
}

// AuthorizedResourceControlAccess checks whether the user can alter an existing resource control.
func AuthorizedResourceControlAccess(resourceControl *portainer.ResourceControl, context *RestrictedRequestContext) bool {
	if context.IsAdmin || resourceControl.Public {
		return true
	}

	for _, access := range resourceControl.TeamAccesses {
		for _, membership := range context.UserMemberships {
			if membership.TeamID == access.TeamID {
				return true
			}
		}
	}

	for _, access := range resourceControl.UserAccesses {
		if context.UserID == access.UserID {
			return true
		}
	}

	return false
}

// AuthorizedResourceControlUpdate ensure that the user can update a resource control object.
// A non-administrator user cannot create a resource control where:
// * the Public flag is set false
// * the AdministratorsOnly flag is set to true
// * he wants to create a resource control without any user/team accesses
// * he wants to add more than one user in the user accesses
// * he wants to add a user in the user accesses that is not corresponding to its id
// * he wants to add a team he is not a member of
func AuthorizedResourceControlUpdate(resourceControl *portainer.ResourceControl, context *RestrictedRequestContext) bool {
	if context.IsAdmin || resourceControl.Public {
		return true
	}

	if resourceControl.AdministratorsOnly {
		return false
	}

	userAccessesCount := len(resourceControl.UserAccesses)
	teamAccessesCount := len(resourceControl.TeamAccesses)

	if userAccessesCount == 0 && teamAccessesCount == 0 {
		return false
	}

	if userAccessesCount > 1 || (userAccessesCount == 1 && teamAccessesCount == 1) {
		return false
	}

	if userAccessesCount == 1 {
		access := resourceControl.UserAccesses[0]
		if access.UserID == context.UserID {
			return true
		}
	}

	if teamAccessesCount > 0 {
		for _, access := range resourceControl.TeamAccesses {
			for _, membership := range context.UserMemberships {
				if membership.TeamID == access.TeamID {
					return true
				}
			}
		}
	}

	return false
}

// AuthorizedTeamManagement ensure that access to the management of the specified team is granted.
// It will check if the user is either administrator or leader of that team.
func AuthorizedTeamManagement(teamID portainer.TeamID, context *RestrictedRequestContext) bool {
	if context.IsAdmin {
		return true
	}

	for _, membership := range context.UserMemberships {
		if membership.TeamID == teamID && membership.Role == portainer.TeamLeader {
			return true
		}
	}

	return false
}

// AuthorizedIsTeamLeader ensure that the user is an admin or a team leader
func AuthorizedIsTeamLeader(context *RestrictedRequestContext) bool {
	return context.IsAdmin || context.IsTeamLeader
}

// AuthorizedIsAdmin ensure that the user is an admin
func AuthorizedIsAdmin(context *RestrictedRequestContext) bool {
	return context.IsAdmin
}

// AuthorizedEndpointAccess ensure that the user can access the specified environment(endpoint).
// It will check if the user is part of the authorized users or part of a team that is
// listed in the authorized teams of the environment(endpoint) and the associated group.
func AuthorizedEndpointAccess(endpoint *portainer.Endpoint, endpointGroup *portainer.EndpointGroup, userID portainer.UserID, memberships []portainer.TeamMembership) bool {
	groupAccess := AuthorizedAccess(userID, memberships, endpointGroup.UserAccessPolicies, endpointGroup.TeamAccessPolicies)
	if !groupAccess {
		return AuthorizedAccess(userID, memberships, endpoint.UserAccessPolicies, endpoint.TeamAccessPolicies)
	}
	return true
}

// authorizedEndpointGroupAccess ensure that the user can access the specified environment(endpoint) group.
// It will check if the user is part of the authorized users or part of a team that is
// listed in the authorized teams.
func authorizedEndpointGroupAccess(endpointGroup *portainer.EndpointGroup, userID portainer.UserID, memberships []portainer.TeamMembership) bool {
	return AuthorizedAccess(userID, memberships, endpointGroup.UserAccessPolicies, endpointGroup.TeamAccessPolicies)
}

// AuthorizedRegistryAccess ensure that the user can access the specified registry.
// It will check if the user is part of the authorized users or part of a team that is
// listed in the authorized teams for a specified environment(endpoint),
func AuthorizedRegistryAccess(registry *portainer.Registry, user *portainer.User, teamMemberships []portainer.TeamMembership, endpointID portainer.EndpointID) bool {
	if user.Role == portainer.AdministratorRole {
		return true
	}

	registryEndpointAccesses := registry.RegistryAccesses[endpointID]

	return AuthorizedAccess(user.ID, teamMemberships, registryEndpointAccesses.UserAccessPolicies, registryEndpointAccesses.TeamAccessPolicies)
}

// AuthorizedAccess verifies the userID or memberships are authorized to use an object per the supplied access policies
func AuthorizedAccess(userID portainer.UserID, memberships []portainer.TeamMembership, userAccessPolicies portainer.UserAccessPolicies, teamAccessPolicies portainer.TeamAccessPolicies) bool {
	_, userAccess := userAccessPolicies[userID]
	if userAccess {
		return true
	}

	for _, membership := range memberships {
		_, teamAccess := teamAccessPolicies[membership.TeamID]
		if teamAccess {
			return true
		}
	}

	return false
}

func UpdateUserServiceAccountsForEndpoint(endpointID portainer.EndpointID, dataStore dataservices.DataStore, k8sClientFactory *cli.ClientFactory) {
	endpoint, err := dataStore.Endpoint().Endpoint(endpointID)
	if err != nil {
		log.Error().Err(err).Msgf("failed fetching endpoint %d", endpointID)
		return
	}

	restrictDefaultNamespace := endpoint.Kubernetes.Configuration.RestrictDefaultNamespace
	userIDs := func() []portainer.UserID {
		userIDs := make([]portainer.UserID, 0)
		for u := range endpoint.UserAccessPolicies {
			userIDs = append(userIDs, u)
		}
		for t := range endpoint.TeamAccessPolicies {
			memberships, _ := dataStore.TeamMembership().TeamMembershipsByTeamID(portainer.TeamID(t))
			for _, membership := range memberships {
				userIDs = append(userIDs, membership.UserID)
			}
		}
		return userIDs
	}

	kubecli, err := k8sClientFactory.GetKubeClient(endpoint)
	if err != nil {
		log.Error().Err(err).Msgf("failed fetching kube client for endpoint %d", endpointID)
		return
	}
	for _, userID := range userIDs() {
		memberships, _ := dataStore.TeamMembership().TeamMembershipsByUserID(portainer.UserID(userID))
		teamIds := make([]int, 0, len(memberships))
		for _, membership := range memberships {
			teamIds = append(teamIds, int(membership.TeamID))
		}

		err := kubecli.SetupUserServiceAccount(int(userID), teamIds, restrictDefaultNamespace)
		if err != nil {
			log.Error().Err(err).Msgf("failed setting-up service account for user %d", userID)
		}
	}
}
