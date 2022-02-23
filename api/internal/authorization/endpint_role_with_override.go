package authorization

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database"
)

// CleanNAPWithOverridePolicies Clean Namespace Access Policies with override policies
func (service *Service) CleanNAPWithOverridePolicies(
	endpoint *portainer.Endpoint,
	endpointGroup *portainer.EndpointGroup,
) error {
	kubecli, err := service.K8sClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return err
	}

	accessPolicies, err := kubecli.GetNamespaceAccessPolicies()
	if err != nil {
		return err
	}

	hasChange := false

	for namespace, policy := range accessPolicies {
		for teamID := range policy.TeamAccessPolicies {
			access, err := service.getTeamEndpointAccessWithPolicies(teamID, endpoint, endpointGroup)
			if err != nil {
				return err
			}
			if !access {
				delete(accessPolicies[namespace].TeamAccessPolicies, teamID)
				hasChange = true
			}
		}

		for userID := range policy.UserAccessPolicies {
			access, err := service.getUserEndpointAccessWithPolicies(userID, endpoint, endpointGroup)
			if err != nil {
				return err
			}
			if !access {
				delete(accessPolicies[namespace].UserAccessPolicies, userID)
				hasChange = true
			}
		}
	}

	if hasChange {
		err = kubecli.UpdateNamespaceAccessPolicies(accessPolicies)
		if err != nil {
			return err
		}
	}

	return nil
}

func (service *Service) getUserEndpointAccessWithPolicies(
	userID database.UserID,
	endpoint *portainer.Endpoint,
	endpointGroup *portainer.EndpointGroup,
) (bool, error) {
	memberships, err := service.dataStore.TeamMembership().TeamMembershipsByUserID(userID)
	if err != nil {
		return false, err
	}

	if endpointGroup == nil {
		endpointGroup, err = service.dataStore.EndpointGroup().EndpointGroup(endpoint.GroupID)
		if err != nil {
			return false, err
		}
	}

	if userAccess(userID, endpoint.UserAccessPolicies, endpoint.TeamAccessPolicies, memberships) {
		return true, nil
	}

	if userAccess(userID, endpointGroup.UserAccessPolicies, endpointGroup.TeamAccessPolicies, memberships) {
		return true, nil
	}

	return false, nil

}

func userAccess(
	userID database.UserID,
	userAccessPolicies database.UserAccessPolicies,
	teamAccessPolicies database.TeamAccessPolicies,
	memberships []portainer.TeamMembership,
) bool {
	if _, ok := userAccessPolicies[userID]; ok {
		return true
	}

	for _, membership := range memberships {
		if _, ok := teamAccessPolicies[membership.TeamID]; ok {
			return true
		}
	}

	return false
}

func (service *Service) getTeamEndpointAccessWithPolicies(
	teamID database.TeamID,
	endpoint *portainer.Endpoint,
	endpointGroup *portainer.EndpointGroup,
) (bool, error) {
	if endpointGroup == nil {
		var err error
		endpointGroup, err = service.dataStore.EndpointGroup().EndpointGroup(endpoint.GroupID)
		if err != nil {
			return false, err
		}
	}

	if teamAccess(teamID, endpoint.TeamAccessPolicies) {
		return true, nil
	}

	if teamAccess(teamID, endpointGroup.TeamAccessPolicies) {
		return true, nil
	}

	return false, nil
}

func teamAccess(
	teamID database.TeamID,
	teamAccessPolicies database.TeamAccessPolicies,
) bool {
	_, ok := teamAccessPolicies[teamID]
	return ok
}
