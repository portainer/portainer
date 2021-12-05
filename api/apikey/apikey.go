package apikey

import (
	"crypto/rand"
	"io"

	portainer "github.com/portainer/portainer/api"
)

// APIKeyService represents a service for managing API keys.
type APIKeyService interface {
	HashRaw(rawKey string) []byte
	GenerateApiKey(user portainer.User, description string) (string, *portainer.APIKey, error)
	GetAPIKey(apiKeyID portainer.APIKeyID) (*portainer.APIKey, error)
	GetAPIKeys(userID portainer.UserID) ([]portainer.APIKey, error)
	GetDigestUserAndKey(digest []byte) (portainer.User, portainer.APIKey, error)
	UpdateAPIKey(apiKey *portainer.APIKey) error
	DeleteAPIKey(apiKeyID portainer.APIKeyID) error
	InvalidateUserKeyCache(userId portainer.UserID) bool
}

// generateRandomKey generates a random key of specified length
// source: https://github.com/gorilla/securecookie/blob/master/securecookie.go#L515
func generateRandomKey(length int) []byte {
	k := make([]byte, length)
	if _, err := io.ReadFull(rand.Reader, k); err != nil {
		return nil
	}
	return k
}
