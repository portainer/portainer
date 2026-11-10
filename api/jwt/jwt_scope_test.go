package jwt

import (
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/require"
)

func newScopeTestService(t *testing.T) *Service {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, false)
	require.NoError(t, store.User().Create(&portainer.User{ID: 1}))

	service, err := NewService("24h", store)
	require.NoError(t, err)

	return service
}

func TestParseAndVerifyToken_CarriesTheScope(t *testing.T) {
	t.Parallel()
	service := newScopeTestService(t)

	t.Run("a session token is default scoped and unbound", func(t *testing.T) {
		token, _, err := service.GenerateToken(&portainer.TokenData{ID: 1})
		require.NoError(t, err)

		parsed, _, _, err := service.ParseAndVerifyToken(token)
		require.NoError(t, err)
		require.Equal(t, portainer.DefaultTokenScope, parsed.Scope)
		require.Equal(t, portainer.EndpointID(portainer.UnscopedToken), parsed.EndpointID)
	})

	t.Run("a kubeconfig token carries its scope and environment", func(t *testing.T) {
		endpointID := portainer.EndpointID(7)

		token, err := service.GenerateTokenForKubeconfig(&portainer.TokenData{ID: 1}, endpointID)
		require.NoError(t, err)

		parsed, _, _, err := service.ParseAndVerifyToken(token)
		require.NoError(t, err)
		require.Equal(t, portainer.KubeconfigTokenScope, parsed.Scope)
		require.Equal(t, endpointID, parsed.EndpointID)
	})

	// The scope reaching the route allowlist is the claim itself, not the secret
	// parseScope selected, so an unknown scope cannot pass as a session.
	t.Run("an unknown scope is carried through rather than normalised", func(t *testing.T) {
		token, err := signedTokenWithScope(service, "other")
		require.NoError(t, err)

		parsed, _, _, err := service.ParseAndVerifyToken(token)
		require.NoError(t, err)
		require.Equal(t, portainer.TokenScope("other"), parsed.Scope)
		require.NotEqual(t, portainer.DefaultTokenScope, parsed.Scope)
	})

	t.Run("a token predating scopes is a session token", func(t *testing.T) {
		token, err := signedTokenWithScope(service, "")
		require.NoError(t, err)

		parsed, _, _, err := service.ParseAndVerifyToken(token)
		require.NoError(t, err)
		require.Equal(t, portainer.DefaultTokenScope, parsed.Scope)

		sessionData, _, _, err := service.ParseAndVerifySessionToken(token)
		require.NoError(t, err)
		require.Equal(t, portainer.UserID(1), sessionData.ID)
	})
}

// The scope is only trustworthy because it selects the signing secret, so a token
// claiming the kubeconfig scope has to be signed with the kubeconfig secret.
func TestParseAndVerifyToken_RejectsAForgedScopeClaim(t *testing.T) {
	t.Parallel()
	service := newScopeTestService(t)

	forged := jwt.NewWithClaims(jwt.SigningMethodHS256, claims{
		UserID:     1,
		Scope:      portainer.KubeconfigTokenScope,
		EndpointID: 1,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	})

	signed, err := forged.SignedString(service.secrets[portainer.DefaultTokenScope])
	require.NoError(t, err)

	_, _, _, err = service.ParseAndVerifyToken(signed)
	require.ErrorIs(t, err, errInvalidJWTToken)
}

// The bouncer treats a kubeconfig token carrying no environment as unrestricted,
// so the service must never mint one.
func TestGenerateTokenForKubeconfig_RejectsAnUnscopedToken(t *testing.T) {
	t.Parallel()
	service := newScopeTestService(t)

	_, err := service.GenerateTokenForKubeconfig(&portainer.TokenData{ID: 1}, portainer.UnscopedToken)
	require.ErrorIs(t, err, errUnscopedKubeconfigToken)
}
