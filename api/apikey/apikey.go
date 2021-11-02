package apikey

import (
	portainer "github.com/portainer/portainer/api"
)

// APIKeyService represents a service for managing API keys.
type APIKeyService interface {
	GenerateApiKey(userID portainer.UserID, description string) ([]byte, *portainer.APIKey, error)
	GetAPIKeys(userID portainer.UserID) ([]portainer.APIKey, error)
	GetAPIKey(digest string) (*portainer.APIKey, error)
	DeleteAPIKey(userID portainer.UserID, apiKeyID portainer.APIKeyID) error
}
