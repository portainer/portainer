package kubernetes

import (
	"io/ioutil"
	"net/http"
	"strconv"
	"sync"

	"github.com/orcaman/concurrent-map"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

const defaultServiceAccountTokenFile = "/var/run/secrets/kubernetes.io/serviceaccount/token"

type tokenManager struct {
	kubecli    portainer.KubeClient
	mutex      sync.Mutex
	adminToken string
	userTokens cmap.ConcurrentMap
}

func (manager *tokenManager) getTokenFromRequest(request *http.Request, localAdminLookup bool) (string, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return "", err
	}

	if tokenData.Role == portainer.AdministratorRole {
		if localAdminLookup {
			if manager.adminToken == "" {
				token, err := ioutil.ReadFile(defaultServiceAccountTokenFile)
				if err != nil {
					return "", err
				}

				manager.adminToken = string(token)
			}

			return manager.adminToken, nil
		}

		return "", nil
	}

	key := strconv.Itoa(int(tokenData.ID))
	token, ok := manager.userTokens.Get(key)
	if !ok {
		manager.mutex.Lock()
		defer manager.mutex.Unlock()

		err := manager.kubecli.SetupUserServiceAccount(int(tokenData.ID), tokenData.Username)
		if err != nil {
			return "", err
		}

		serviceAccountToken, err := manager.kubecli.GetServiceAccountBearerToken(int(tokenData.ID), tokenData.Username)
		if err != nil {
			return "", err
		}

		manager.userTokens.Set(key, serviceAccountToken)
		token = serviceAccountToken
	}

	return token.(string), nil
}
