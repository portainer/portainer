package registryutils

import (
	"context"
	"fmt"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/aws/ecr"
	"github.com/portainer/portainer/api/dataservices"

	"github.com/rs/zerolog/log"
)

func isRegTokenValid(registry *portainer.Registry) (valid bool) {
	return registry.AccessToken != "" && registry.AccessTokenExpiry > time.Now().Unix()
}

func fetchRegToken(registry *portainer.Registry) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	ecrClient := ecr.NewService(registry.Username, registry.Password, registry.Ecr.Region)
	accessToken, expiryAt, err := ecrClient.GetAuthorizationToken(ctx)
	if err != nil {
		return err
	}
	registry.AccessToken = *accessToken
	registry.AccessTokenExpiry = expiryAt.Unix()

	return nil
}

func doGetRegToken(tx dataservices.DataStoreTx, registry *portainer.Registry) error {
	if err := fetchRegToken(registry); err != nil {
		return err
	}

	return tx.Registry().Update(registry.ID, registry)
}

// RefreshAndPersistECRTokens refreshes and persists ECR tokens for all registries that need it.
// Must be called with a real DataStoreTx (not a top-level DataStore) to avoid write-lock contention.
func RefreshAndPersistECRTokens(tx dataservices.DataStoreTx, registries []portainer.Registry) {
	for i := range registries {
		reg := &registries[i]
		if reg.Type != portainer.EcrRegistry {
			continue
		}
		if isRegTokenValid(reg) {
			continue
		}
		if err := doGetRegToken(tx, reg); err != nil {
			log.Warn().
				Err(err).
				Str("RegistryName", reg.Name).
				Msg("Failed to get valid ECR registry token. Skip logging with this registry.")
		}
	}
}

func EnsureRegTokenValid(tx dataservices.DataStoreTx, registry *portainer.Registry) error {
	if registry.Type != portainer.EcrRegistry {
		return nil
	}

	if isRegTokenValid(registry) {
		log.Debug().Msg("current ECR token is still valid")

		return nil
	}

	if err := doGetRegToken(tx, registry); err != nil {
		log.Debug().Msg("refresh ECR token")

		return err
	}

	return nil
}

func GetRegEffectiveCredential(registry *portainer.Registry) (username, password string, err error) {
	username = registry.Username
	password = registry.Password

	if registry.Type == portainer.EcrRegistry {
		// Fallback token refresh in case the upstream caller did not pre-validate the token.
		if !isRegTokenValid(registry) {
			if err := fetchRegToken(registry); err != nil {
				return "", "", fmt.Errorf("ECR registry %q credentials are invalid or expired. Error: %w", registry.Name, err)
			}
		}

		username, password, err = ecr.NewService(registry.Username, registry.Password, registry.Ecr.Region).
			ParseAuthorizationToken(registry.AccessToken)
	}

	return
}

// PrepareRegistryCredentials consolidates the common pattern of ensuring valid ECR token
// and setting effective credentials on the registry when authentication is enabled.
// This function modifies the registry in-place by setting Username and Password to the effective values.
func PrepareRegistryCredentials(tx dataservices.DataStoreTx, registry *portainer.Registry) error {
	if !registry.Authentication {
		return nil
	}

	if err := EnsureRegTokenValid(tx, registry); err != nil {
		return err
	}

	username, password, err := GetRegEffectiveCredential(registry)
	if err != nil {
		return err
	}

	registry.Username = username
	registry.Password = password

	return nil
}
