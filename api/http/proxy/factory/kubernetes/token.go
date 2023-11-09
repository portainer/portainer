package kubernetes

import (
	"fmt"
	"os"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/rs/zerolog/log"
)

const defaultServiceAccountTokenFile = "/var/run/secrets/kubernetes.io/serviceaccount/token"

type tokenManager struct {
	tokenCache *tokenCache
	kubecli    portainer.KubeClient
	dataStore  dataservices.DataStore
	adminToken string
}

// NewTokenManager returns a pointer to a new instance of tokenManager.
// If the useLocalAdminToken parameter is set to true, it will search for the local admin service account
// and associate it to the manager.
func NewTokenManager(kubecli portainer.KubeClient, dataStore dataservices.DataStore, cache *tokenCache, setLocalAdminToken bool) (*tokenManager, error) {
	tokenManager := &tokenManager{
		tokenCache: cache,
		kubecli:    kubecli,
		dataStore:  dataStore,
		adminToken: "",
	}

	if setLocalAdminToken {
		token, err := os.ReadFile(defaultServiceAccountTokenFile)
		if err != nil {
			return nil, err
		}

		tokenManager.adminToken = string(token)
	}

	return tokenManager, nil
}

func (manager *tokenManager) GetAdminServiceAccountToken() string {
	return manager.adminToken
}

func (manager *tokenManager) setupUserServiceAccounts(userID portainer.UserID, endpoint *portainer.Endpoint) error {
	memberships, err := manager.dataStore.TeamMembership().TeamMembershipsByUserID(userID)
	if err != nil {
		return err
	}

	teamIds := make([]int, 0, len(memberships))
	for _, membership := range memberships {
		teamIds = append(teamIds, int(membership.TeamID))
	}

	restrictDefaultNamespace := endpoint.Kubernetes.Configuration.RestrictDefaultNamespace
	err = manager.kubecli.SetupUserServiceAccount(int(userID), teamIds, restrictDefaultNamespace)
	if err != nil {
		return err
	}

	return nil
}

func (manager *tokenManager) UpdateUserServiceAccountsForEndpoint(endpointID portainer.EndpointID) {
	endpoint, err := manager.dataStore.Endpoint().Endpoint(endpointID)
	if err != nil {
		log.Error().Err(err).Msgf("failed fetching environments %d", endpointID)
		return
	}

	userIDs := make([]portainer.UserID, 0)
	for u := range endpoint.UserAccessPolicies {
		userIDs = append(userIDs, u)
	}
	for t := range endpoint.TeamAccessPolicies {
		memberships, _ := manager.dataStore.TeamMembership().TeamMembershipsByTeamID(portainer.TeamID(t))
		for _, membership := range memberships {
			userIDs = append(userIDs, membership.UserID)
		}
	}

	for _, userID := range userIDs {
		if err := manager.setupUserServiceAccounts(userID, endpoint); err != nil {
			log.Error().Err(err).Msgf("failed setting-up service account for user %d", userID)
		}
	}
}

// GetUserServiceAccountToken setup a user's service account if it does not exist, then retrieve its token
func (manager *tokenManager) GetUserServiceAccountToken(userID int, endpointID portainer.EndpointID) (string, error) {
	tokenFunc := func() (string, error) {
		endpoint, err := manager.dataStore.Endpoint().Endpoint(endpointID)
		if err != nil {
			log.Error().Err(err).Msgf("failed fetching environment %d", endpointID)
			return "", err
		}

		if err := manager.setupUserServiceAccounts(portainer.UserID(userID), endpoint); err != nil {
			return "", fmt.Errorf("failed setting-up service account for user %d: %w", userID, err)
		}

		return manager.kubecli.GetServiceAccountBearerToken(userID)
	}

	return manager.tokenCache.getOrAddToken(portainer.UserID(userID), tokenFunc)
}
