package jwt

import (
	"time"

	portainer "github.com/portainer/portainer/api"
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

	// https://go.dev/play/p/bOrt6cQpA0I time.Time defaults to a zero value which is 0001-01-01 00:00:00 +0000 UTC
	var expiryAt time.Time
	if expiryDuration > time.Duration(0) {
		expiryAt = time.Now().Add(expiryDuration)
	}

	return service.generateSignedToken(data, expiryAt, kubeConfigScope)
}
