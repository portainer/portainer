package kubernetes

import (
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/rs/zerolog/log"
)

const (
	defaultServiceAccountTokenFile = "/var/run/secrets/kubernetes.io/serviceaccount/token"
	adminTokenRefreshInterval      = 30 * time.Second
)

// adminTokenSource re-reads the projected service account token from disk so that
// the rotation performed by the kubelet is picked up without restarting the process.
type adminTokenSource struct {
	path            string
	refreshInterval time.Duration

	mu          sync.RWMutex
	token       string
	lastAttempt time.Time
}

func newAdminTokenSource(path string, refreshInterval time.Duration) (*adminTokenSource, error) {
	source := &adminTokenSource{
		path:            path,
		refreshInterval: refreshInterval,
	}

	if _, err := source.refresh(); err != nil {
		return nil, fmt.Errorf("failed reading the service account token from %s. Error: %w", path, err)
	}

	return source, nil
}

func (source *adminTokenSource) refresh() (string, error) {
	source.mu.Lock()
	defer source.mu.Unlock()

	// another caller refreshed while this one waited for the lock
	if time.Since(source.lastAttempt) < source.refreshInterval {
		return source.token, nil
	}

	source.lastAttempt = time.Now()

	content, err := os.ReadFile(source.path)
	if err != nil {
		return "", err
	}

	token := strings.TrimSpace(string(content))
	if token == "" {
		return "", fmt.Errorf("the service account token file %s is empty", source.path)
	}

	source.token = token

	return token, nil
}

func (source *adminTokenSource) Token() string {
	source.mu.RLock()
	token, lastAttempt := source.token, source.lastAttempt
	source.mu.RUnlock()

	if time.Since(lastAttempt) < source.refreshInterval {
		return token
	}

	refreshed, err := source.refresh()
	if err != nil {
		log.Warn().Err(err).
			Str("path", source.path).
			Msg("unable to re-read the service account token, falling back to the last known value")

		return token
	}

	return refreshed
}

type tokenManager struct {
	tokenCache *tokenCache
	kubecli    portainer.KubeClient
	dataStore  dataservices.DataStore
	adminToken *adminTokenSource
}

// NewTokenManager returns a pointer to a new instance of tokenManager.
// If the useLocalAdminToken parameter is set to true, it will search for the local admin service account
// and associate it to the manager.
func NewTokenManager(kubecli portainer.KubeClient, dataStore dataservices.DataStore, cache *tokenCache, setLocalAdminToken bool) (*tokenManager, error) {
	tokenManager := &tokenManager{
		tokenCache: cache,
		kubecli:    kubecli,
		dataStore:  dataStore,
	}

	if setLocalAdminToken {
		source, err := newAdminTokenSource(defaultServiceAccountTokenFile, adminTokenRefreshInterval)
		if err != nil {
			return nil, err
		}

		tokenManager.adminToken = source
	}

	return tokenManager, nil
}

func (manager *tokenManager) GetAdminServiceAccountToken() string {
	if manager.adminToken == nil {
		return ""
	}

	return manager.adminToken.Token()
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
		memberships, _ := manager.dataStore.TeamMembership().TeamMembershipsByTeamID(t)
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
