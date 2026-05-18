package registryutils_test

import (
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/registryutils"
	"github.com/stretchr/testify/require"
)

func newECRRegistry(id portainer.RegistryID, accessToken string, expiry int64) portainer.Registry {
	return portainer.Registry{
		ID:                id,
		Type:              portainer.EcrRegistry,
		Name:              "test-ecr",
		Username:          "AKIAIOSFODNN7EXAMPLE",
		Password:          "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
		Ecr:               portainer.EcrData{Region: "us-east-1"},
		AccessToken:       accessToken,
		AccessTokenExpiry: expiry,
	}
}

func TestValidateRegistriesECRTokens(t *testing.T) {
	t.Parallel()

	t.Run("skips non-ECR registries without error", func(t *testing.T) {
		t.Parallel()
		_, ds := datastore.MustNewTestStore(t, true, false)
		registries := []portainer.Registry{
			{ID: 1, Type: portainer.DockerHubRegistry, Name: "dockerhub"},
			{ID: 2, Type: portainer.CustomRegistry, Name: "custom"},
		}
		require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return registryutils.ValidateRegistriesECRTokens(tx, registries)
		}))
	})

	t.Run("skips ECR registries with valid tokens", func(t *testing.T) {
		t.Parallel()
		_, ds := datastore.MustNewTestStore(t, true, false)
		reg := newECRRegistry(1, "valid-token", time.Now().Add(time.Hour).Unix())
		require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return registryutils.ValidateRegistriesECRTokens(tx, []portainer.Registry{reg})
		}))
	})

	t.Run("returns nil for empty registry list", func(t *testing.T) {
		t.Parallel()
		_, ds := datastore.MustNewTestStore(t, true, false)
		require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return registryutils.ValidateRegistriesECRTokens(tx, []portainer.Registry{})
		}))
	})

	t.Run("returns error for ECR registry with missing token", func(t *testing.T) {
		t.Parallel()
		_, ds := datastore.MustNewTestStore(t, true, false)
		reg := newECRRegistry(1, "", 0)
		require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return tx.Registry().Create(&reg)
		}))

		var validateErr error
		_ = ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
			validateErr = registryutils.ValidateRegistriesECRTokens(tx, []portainer.Registry{reg})
			return nil
		})
		require.Error(t, validateErr)
		require.Contains(t, validateErr.Error(), "test-ecr")
	})

	t.Run("stops on first invalid ECR registry and includes its name in error", func(t *testing.T) {
		t.Parallel()
		_, ds := datastore.MustNewTestStore(t, true, false)

		validECR := newECRRegistry(1, "valid-token", time.Now().Add(time.Hour).Unix())
		invalidECR := newECRRegistry(2, "", 0)
		invalidECR.Name = "invalid-ecr"
		nonECR := portainer.Registry{ID: 3, Type: portainer.DockerHubRegistry}

		require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return tx.Registry().Create(&invalidECR)
		}))

		var validateErr error
		_ = ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
			validateErr = registryutils.ValidateRegistriesECRTokens(tx, []portainer.Registry{validECR, invalidECR, nonECR})
			return nil
		})
		require.Error(t, validateErr)
		require.Contains(t, validateErr.Error(), "invalid-ecr")
	})
}

func TestGetRegEffectiveCredential(t *testing.T) {
	t.Parallel()

	t.Run("returns username and password directly for non-ECR registry", func(t *testing.T) {
		t.Parallel()
		reg := &portainer.Registry{
			Type:     portainer.DockerHubRegistry,
			Username: "user",
			Password: "pass",
		}
		username, password, err := registryutils.GetRegEffectiveCredential(reg)
		require.NoError(t, err)
		require.Equal(t, "user", username)
		require.Equal(t, "pass", password)
	})

	t.Run("parses ECR access token when token is valid", func(t *testing.T) {
		t.Parallel()
		reg := newECRRegistry(1, "AWS:ecr-password", time.Now().Add(time.Hour).Unix())
		username, password, err := registryutils.GetRegEffectiveCredential(&reg)
		require.NoError(t, err)
		require.Equal(t, "AWS", username)
		require.Equal(t, "ecr-password", password)
	})

	t.Run("returns error for ECR registry with missing token and invalid credentials", func(t *testing.T) {
		t.Parallel()
		reg := newECRRegistry(1, "", 0)
		_, _, err := registryutils.GetRegEffectiveCredential(&reg)
		require.Error(t, err)
		require.Contains(t, err.Error(), "test-ecr")
	})
}
