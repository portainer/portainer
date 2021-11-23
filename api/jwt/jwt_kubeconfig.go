package jwt

import (
	portainer "github.com/portainer/portainer/api"
	"time"
)

// GenerateTokenForKubeconfig generates a new JWT token for Kubeconfig
func (service *Service) GenerateTokenForKubeconfig(data *portainer.TokenData) (string, error) {
	settings, err := service.dataStore.Settings().Settings()
	if err != nil {
		return "", err
	}

	expiryDuration, err := time.ParseDuration(settings.KubeconfigExpiry)
	if err != nil {
		return "", err
	}

	expiryAt := time.Now().Add(expiryDuration).Unix()
	if expiryDuration == time.Duration(0) {
		expiryAt = 0
	}

	return service.generateSignedToken(data, expiryAt, kubeConfigScope)
}
