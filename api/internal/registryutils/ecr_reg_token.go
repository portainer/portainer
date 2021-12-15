package registryutils

import (
	"time"

	log "github.com/sirupsen/logrus"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/aws/ecr"
	"github.com/portainer/portainer/api/dataservices"
)

func isRegTokenValid(registry *portainer.Registry) (valid bool) {
	return registry.AccessToken != "" && registry.AccessTokenExpiry > time.Now().Unix()
}

func doGetRegToken(dataStore dataservices.DataStore, registry *portainer.Registry) (err error) {
	ecrClient := ecr.NewService(registry.Username, registry.Password, registry.Ecr.Region)
	accessToken, expiryAt, err := ecrClient.GetAuthorizationToken()
	if err != nil {
		return
	}

	registry.AccessToken = *accessToken
	registry.AccessTokenExpiry = expiryAt.Unix()

	err = dataStore.Registry().UpdateRegistry(registry.ID, registry)

	return
}

func parseRegToken(registry *portainer.Registry) (username, password string, err error) {
	ecrClient := ecr.NewService(registry.Username, registry.Password, registry.Ecr.Region)
	return ecrClient.ParseAuthorizationToken(registry.AccessToken)
}

func EnsureRegTokenValid(dataStore dataservices.DataStore, registry *portainer.Registry) (err error) {
	if registry.Type == portainer.EcrRegistry {
		if isRegTokenValid(registry) {
			log.Println("[DEBUG] [registry, GetEcrAccessToken] [message: curretn ECR token is still valid]")
		} else {
			err = doGetRegToken(dataStore, registry)
			if err != nil {
				log.Println("[DEBUG] [registry, GetEcrAccessToken] [message: refresh ECR token]")
			}
		}
	}

	return
}

func GetRegEffectiveCredential(registry *portainer.Registry) (username, password string, err error) {
	if registry.Type == portainer.EcrRegistry {
		username, password, err = parseRegToken(registry)
	} else {
		username = registry.Username
		password = registry.Password
	}
	return
}
