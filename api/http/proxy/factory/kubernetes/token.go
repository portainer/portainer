package kubernetes

import (
	"os"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
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

// GetUserServiceAccountToken setup a user's service account if it does not exist, then retrieve its token
func (manager *tokenManager) GetUserServiceAccountToken(userID int, endpointID portainer.EndpointID) (string, error) {
	tokenFunc := func() (string, error) {
		memberships, err := manager.dataStore.TeamMembership().TeamMembershipsByUserID(portainer.UserID(userID))
		if err != nil {
			return "", err
		}

		teamIds := make([]int, 0, len(memberships))
		for _, membership := range memberships {
			teamIds = append(teamIds, int(membership.TeamID))
		}

		endpoint, err := manager.dataStore.Endpoint().Endpoint(endpointID)
		if err != nil {
			return "", err
		}

		restrictDefaultNamespace := endpoint.Kubernetes.Configuration.RestrictDefaultNamespace
		err = manager.kubecli.SetupUserServiceAccount(userID, teamIds, restrictDefaultNamespace)
		if err != nil {
			return "", err
		}

		return manager.kubecli.GetServiceAccountBearerToken(userID)
	}

	return manager.tokenCache.getOrAddToken(portainer.UserID(userID), tokenFunc)
}
