package jwt

import (
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseAndVerifySessionToken(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)

	require.NoError(t, store.User().Create(&portainer.User{ID: 1}))

	settings, err := store.Settings().Settings()
	require.NoError(t, err)

	settings.KubeconfigExpiry = "0"
	require.NoError(t, store.Settings().UpdateSettings(settings))

	service, err := NewService("1h", store)
	require.NoError(t, err)

	data := &portainer.TokenData{Username: "User", ID: 1, Role: 1}

	sessionToken, _, err := service.GenerateToken(data)
	require.NoError(t, err)

	tokenData, _, _, err := service.ParseAndVerifySessionToken(sessionToken)
	require.NoError(t, err)
	assert.Equal(t, portainer.UserID(1), tokenData.ID)

	kubeconfigToken, err := service.GenerateTokenForKubeconfig(data)
	require.NoError(t, err)

	_, _, _, err = service.ParseAndVerifySessionToken(kubeconfigToken)
	require.Error(t, err, "a kubeconfig token is not a session")

	unknownScopeToken, err := signedTokenWithScope(service, "other")
	require.NoError(t, err)

	_, _, _, err = service.ParseAndVerifyToken(unknownScopeToken)
	require.NoError(t, err, "an unknown scope falls back to the session secret")

	_, _, _, err = service.ParseAndVerifySessionToken(unknownScopeToken)
	require.Error(t, err, "only the session scope is a session")
}

// signedTokenWithScope signs a token carrying an arbitrary scope with the
// session secret, which generateSignedToken refuses to do.
func signedTokenWithScope(service *Service, s scope) (string, error) {
	cl := claims{
		UserID:   1,
		Username: "User",
		Role:     1,
		Scope:    s,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        "token-id",
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}

	return jwt.NewWithClaims(jwt.SigningMethodHS256, cl).SignedString(service.secrets[defaultScope])
}
