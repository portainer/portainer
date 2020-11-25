package kubernetes

import (
	"fmt"
	"io/ioutil"
	"log"
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/authorization"
)

const defaultServiceAccountTokenFile = "/var/run/secrets/kubernetes.io/serviceaccount/token"

type tokenManager struct {
	tokenCache  *tokenCache
	kubecli     portainer.KubeClient
	dataStore   portainer.DataStore
	mutex       sync.Mutex
	adminToken  string
	authService *authorization.Service
}

// NewTokenManager returns a pointer to a new instance of tokenManager.
// If the useLocalAdminToken parameter is set to true, it will search for the local admin service account
// and associate it to the manager.
func NewTokenManager(
	kubecli portainer.KubeClient,
	dataStore portainer.DataStore,
	cache *tokenCache,
	setLocalAdminToken bool,
	authService *authorization.Service,
) (*tokenManager, error) {
	tokenManager := &tokenManager{
		tokenCache:  cache,
		kubecli:     kubecli,
		dataStore:   dataStore,
		mutex:       sync.Mutex{},
		adminToken:  "",
		authService: authService,
	}

	if setLocalAdminToken {
		token, err := ioutil.ReadFile(defaultServiceAccountTokenFile)
		if err != nil {
			return nil, err
		}

		tokenManager.adminToken = string(token)
	}

	return tokenManager, nil
}

func (manager *tokenManager) getAdminServiceAccountToken() string {
	return manager.adminToken
}

// setup a user's service account if not exist, then retrieve its token
func (manager *tokenManager) getUserServiceAccountToken(
	userID int, endpointID int,
) (string, error) {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	token, ok := manager.tokenCache.getToken(userID)
	if !ok {
		user, err := manager.dataStore.User().User(portainer.UserID(userID))
		if err != nil || user == nil {
			return "", err
		}

		endpointRole, err := manager.authService.GetUserEndpointRole(userID, endpointID)
		if err != nil || endpointRole == nil {
			return "", err
		}

		endpoint, err := manager.dataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
		if err != nil {
			return "", err
		}

		namespaces, err := manager.kubecli.GetNamespaces()
		if err != nil {
			return "", err
		}

		accessPolicies, err := manager.kubecli.GetNamespaceAccessPolicies()
		if err != nil {
			return "", err
		}
		// update the namespace access policies based on user's role, also in configmap.
		accessPolicies, hasChange, err := manager.authService.UpdateUserNamespaceAccessPolicies(
			userID, endpoint, accessPolicies,
		)
		if hasChange {
			err = manager.kubecli.UpdateNamespaceAccessPolicies(accessPolicies)
			if err != nil {
				return "", err
			}
		}

		namespaceRoles, err := manager.authService.GetUserNamespaceRoles(
			userID, int(endpointRole.ID), endpointID, accessPolicies, namespaces,
			endpointRole.Authorizations, endpoint.Kubernetes.Configuration,
		)
		if err != nil {
			return "", err
		}

		debug := ""
		for ns, r := range namespaceRoles {
			debug = fmt.Sprintf("%s%s:%s;", debug, ns, r.Name)
		}

		log.Printf("[DEBUG][RBAC] user %d has roles (%s) @ %d", userID, debug, endpointID)

		err = manager.kubecli.SetupUserServiceAccount(
			*user, endpointRole.ID, namespaces, namespaceRoles,
		)
		if err != nil {
			return "", err
		}

		serviceAccountToken, err := manager.kubecli.GetServiceAccountBearerToken(userID)
		if err != nil {
			return "", err
		}

		manager.tokenCache.addToken(userID, serviceAccountToken)
		token = serviceAccountToken
	}

	return token, nil
}
