package apikey

import (
	portainer "github.com/portainer/portainer/api"
)

// APIKeyService represents a service for managing API keys.
type APIKeyService interface {
	HashRaw(rawKey string) ([]byte, error)
	GenerateApiKey(user portainer.User, description string) (string, *portainer.APIKey, error)
	GetAPIKeys(userID portainer.UserID) ([]portainer.APIKey, error)
	GetDigestUserAndKey(digest []byte) (portainer.User, portainer.APIKey, error)
	UpdateAPIKey(apiKey *portainer.APIKey) error
	DeleteAPIKey(apiKeyID portainer.APIKeyID) error
}
