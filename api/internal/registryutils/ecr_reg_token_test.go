package registryutils_test

import (
	"io"
	"strings"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/registryutils"
	zerolog "github.com/rs/zerolog/log"
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

func TestRefreshAndPersistECRTokens(t *testing.T) {
	t.Run("does not modify token for ECR registry with valid token", func(t *testing.T) {
		_, ds := datastore.MustNewTestStore(t, true, false)
		reg := newECRRegistry(1, "valid-token", time.Now().Add(time.Hour).Unix())
		require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
			registryutils.RefreshAndPersistECRTokens(tx, []portainer.Registry{reg})
			return nil
		}))
		require.Equal(t, "valid-token", reg.AccessToken)
	})

	t.Run("does not block and leaves token empty when ECR token refresh fails", func(t *testing.T) {
		var logOutput strings.Builder
		setupLogOutput(t, &logOutput)

		_, ds := datastore.MustNewTestStore(t, true, false)
		reg := newECRRegistry(1, "", 0)
		require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
			registryutils.RefreshAndPersistECRTokens(tx, []portainer.Registry{reg})
			return nil
		}))
		require.Empty(t, reg.AccessToken)
		require.Contains(t, logOutput.String(), "test-ecr")
		require.Contains(t, logOutput.String(), "Failed to get valid ECR registry token")
	})
}

func setupLogOutput(t *testing.T, w io.Writer) {
	t.Helper()

	oldLogger := zerolog.Logger
	zerolog.Logger = zerolog.Output(w)
	t.Cleanup(func() {
		zerolog.Logger = oldLogger
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
