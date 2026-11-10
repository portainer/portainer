package jwt

import (
	"errors"
	"fmt"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

var errUnscopedKubeconfigToken = errors.New("a kubeconfig token must be restricted to an environment")

// kubeconfigExpiryAt resolves the configured kubeconfig lifetime. A zero time means
// the token never expires, which is the default.
func (service *Service) kubeconfigExpiryAt() (time.Time, error) {
	var kubeconfigExpiry string
	if err := service.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		settings, err := tx.Settings().Settings()
		if err != nil {
			return err
		}

		kubeconfigExpiry = settings.KubeconfigExpiry

		return nil
	}); err != nil {
		return time.Time{}, err
	}

	expiryDuration, err := time.ParseDuration(kubeconfigExpiry)
	if err != nil {
		return time.Time{}, err
	}

	// https://go.dev/play/p/bOrt6cQpA0I time.Time defaults to a zero value which is 0001-01-01 00:00:00 +0000 UTC
	if expiryDuration <= 0 {
		return time.Time{}, nil
	}

	return time.Now().Add(expiryDuration), nil
}

// GenerateTokenForKubeconfig generates a new JWT token for Kubeconfig, restricted to the given environment.
func (service *Service) GenerateTokenForKubeconfig(data *portainer.TokenData, endpointID portainer.EndpointID) (string, error) {
	if endpointID == portainer.UnscopedToken {
		return "", errUnscopedKubeconfigToken
	}

	expiryAt, err := service.kubeconfigExpiryAt()
	if err != nil {
		return "", err
	}

	return service.generateSignedToken(data, expiryAt, portainer.KubeconfigTokenScope, endpointID)
}

// GenerateTokensForKubeconfig generates one token per environment, resolving the
// configured expiry once rather than once per environment. Every token stays
// restricted to a single environment, so a kubeconfig spanning many environments
// carries many constant-size tokens instead of one that grows with the count.
func (service *Service) GenerateTokensForKubeconfig(data *portainer.TokenData, endpointIDs []portainer.EndpointID) (map[portainer.EndpointID]string, error) {
	expiryAt, err := service.kubeconfigExpiryAt()
	if err != nil {
		return nil, err
	}

	tokens := make(map[portainer.EndpointID]string, len(endpointIDs))
	for _, endpointID := range endpointIDs {
		if endpointID == portainer.UnscopedToken {
			return nil, errUnscopedKubeconfigToken
		}

		token, err := service.generateSignedToken(data, expiryAt, portainer.KubeconfigTokenScope, endpointID)
		if err != nil {
			return nil, fmt.Errorf("unable to generate a token for environment %d: %w", endpointID, err)
		}

		tokens[endpointID] = token
	}

	return tokens, nil
}
