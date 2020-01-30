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
	kubecli               portainer.KubeClient
	teamMemberShipService portainer.TeamMembershipService
	mutex                 sync.Mutex
	adminToken            string
	userTokens            cmap.ConcurrentMap
}

func newTokenManager(kubecli portainer.KubeClient, teamMembershipService portainer.TeamMembershipService, useLocalAdminToken bool) (*tokenManager, error) {
	tokenManager := &tokenManager{
		kubecli:               kubecli,
		teamMemberShipService: teamMembershipService,
		mutex:                 sync.Mutex{},
		userTokens:            cmap.New(),
	}

	if useLocalAdminToken {
		token, err := ioutil.ReadFile(defaultServiceAccountTokenFile)
		if err != nil {
			return nil, err
		}

		tokenManager.adminToken = string(token)
	}

	return tokenManager, nil
}

func (manager *tokenManager) getTokenFromRequest(request *http.Request, useLocalAdminToken bool) (string, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return "", err
	}

	if tokenData.Role == portainer.AdministratorRole {
		if useLocalAdminToken {
			return manager.adminToken, nil
		}

		return "", nil
	}

	key := strconv.Itoa(int(tokenData.ID))
	token, ok := manager.userTokens.Get(key)
	if !ok {
		manager.mutex.Lock()
		defer manager.mutex.Unlock()

		memberships, err := manager.teamMemberShipService.TeamMembershipsByUserID(tokenData.ID)
		if err != nil {
			return "", err
		}

		teamIds := make([]int, 0)
		for _, membership := range memberships {
			teamIds = append(teamIds, int(membership.TeamID))
		}

		err = manager.kubecli.SetupUserServiceAccount(int(tokenData.ID), tokenData.Username, teamIds)
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
