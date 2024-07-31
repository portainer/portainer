package rbacutils

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/kubernetes/cli"
)

// IsAdmin checks if user is a Portainer Admin based on the user's access policies
// if the user is not in the UserAccessPolicies map, then the user is an admin
// otherwise, the user defaults to a standard user in CE
// for non-admin users, allowed namespaces will be returned
func IsAdmin(user *portainer.User, endpoint *portainer.Endpoint, dataStore dataservices.DataStore, clientFactory *cli.ClientFactory) (bool, []string, error) {
	if user == nil {
		return false, nil, fmt.Errorf("an error occurred during the IsAdmin operation, user is nil. Unable to check if user is an admin")
	}

	if len(endpoint.UserAccessPolicies) > 0 {
		_, ok := endpoint.UserAccessPolicies[user.ID]
		if ok {
			nonAdminNamespaces, err := cli.GetNonAdminNamespaces(int(user.ID), endpoint, clientFactory)
			if err != nil {
				return false, nil, fmt.Errorf("an error occurred during the IsAdmin operation, unable to retrieve non-admin namespaces. Error: %v", err)
			}
			return false, nonAdminNamespaces, nil
		}
	}

	if len(endpoint.TeamAccessPolicies) > 0 {
		teamMemberships, err := dataStore.TeamMembership().TeamMembershipsByUserID(user.ID)
		if err != nil {
			return false, nil, fmt.Errorf("an error occurred during the IsAdmin operation, unable to retrieve user team memberships to fetch allowed namespace access. Error: %v", err)
		}

		for _, teamMembership := range teamMemberships {
			_, ok := endpoint.TeamAccessPolicies[teamMembership.TeamID]
			if ok {
				nonAdminNamespaces, err := cli.GetNonAdminNamespaces(int(user.ID), endpoint, clientFactory)
				if err != nil {
					return false, nil, fmt.Errorf("an error occurred during the IsAdmin operation, unable to retrieve non-admin namespaces. Error: %v", err)
				}
				return false, nonAdminNamespaces, nil
			}
		}
	}

	return true, nil, nil
}
