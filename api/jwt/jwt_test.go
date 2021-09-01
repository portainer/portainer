package jwt

import (
	"testing"
	"time"

	"github.com/dgrijalva/jwt-go"
	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

func TestGenerateSignedToken(t *testing.T) {
	svc, err := NewService("24h", nil)
	assert.NoError(t, err, "failed to create a copy of service")

	token := &portainer.TokenData{
		Username: "Joe",
		ID:       1,
		Role:     1,
	}
	expiresAt := time.Now().Add(1 * time.Hour).Unix()

	generatedToken, err := svc.generateSignedToken(token, expiresAt)
	assert.NoError(t, err, "failed to generate a signed token")

	parsedToken, err := jwt.ParseWithClaims(generatedToken, &claims{}, func(token *jwt.Token) (interface{}, error) {
		return svc.secret, nil
	})
	assert.NoError(t, err, "failed to parse generated token")

	tokenClaims, ok := parsedToken.Claims.(*claims)
	assert.Equal(t, true, ok, "failed to claims out of generated ticket")

	assert.Equal(t, token.Username, tokenClaims.Username)
	assert.Equal(t, int(token.ID), tokenClaims.UserID)
	assert.Equal(t, int(token.Role), tokenClaims.Role)
	assert.Equal(t, expiresAt, tokenClaims.ExpiresAt)
}
