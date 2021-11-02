package apikey

import (
	"crypto/sha256"
	"time"

	"github.com/gorilla/securecookie"
	"github.com/pkg/errors"

	portainer "github.com/portainer/portainer/api"
)

type apiKeyService struct {
	apiKeyRepository portainer.APIKeyRepository
	cache            *apiKeyCache
}

func NewAPIKeyService(apiKeyRepository portainer.APIKeyRepository) *apiKeyService {
	return &apiKeyService{
		apiKeyRepository: apiKeyRepository,
		cache:            NewAPIKeyCache(),
	}
}

// GenerateApiKey generates an API key for a user; returns rawApiKey (for one-time display).
// The generated API key is stored in the database.
func (a *apiKeyService) GenerateApiKey(userID portainer.UserID, description string) ([]byte, error) {
	rawAPIKey := securecookie.GenerateRandomKey(32)
	rawAPIKeyChars := []rune(string(rawAPIKey))
	hashDigest := sha256.Sum256(rawAPIKey)

	apiKey := &portainer.APIKey{
		UserID:      userID,
		Description: description,
		Prefix:      [3]rune{rawAPIKeyChars[0], rawAPIKeyChars[1], rawAPIKeyChars[2]},
		DateCreated: time.Now(),
		Digest:      hashDigest,
	}

	err := a.apiKeyRepository.CreateAPIKey(apiKey)
	if err != nil {
		return nil, errors.Wrap(err, "Unable to create API key")
	}

	// persist api-key to cache
	a.cache.Set(apiKey)

	return rawAPIKey, nil
}

// GetAPIKeys returns all the API keys associated to a user.
func (a *apiKeyService) GetAPIKeys(userID portainer.UserID) ([]portainer.APIKey, error) {
	return a.apiKeyRepository.GetAPIKeysByUserID(userID)
}

// GetAPIKey returns the api-key associated to a specified hash digest.
func (a *apiKeyService) GetAPIKey(digest string) (*portainer.APIKey, error) {
	// get api key from cache if possible
	cachedKey, ok := a.cache.GetAPIKey(digest)
	if ok {
		return cachedKey, nil
	}

	apiKey, err := a.apiKeyRepository.GetAPIKeyByDigest(digest)
	if err != nil {
		return nil, errors.Wrap(err, "Unable to retrieve API key")
	}

	return &apiKey, nil
}

// DeleteAPIKey deletes an API key and removes the digest/api-key entry from the cache.
func (a *apiKeyService) DeleteAPIKey(userID portainer.UserID, apiKeyID portainer.APIKeyID) error {
	apiKeys, err := a.GetAPIKeys(userID)
	if err != nil {
		return errors.Wrap(err, "Unable to retrieve API keys associated to the user")
	}

	var apiKey *portainer.APIKey
	for _, key := range apiKeys {
		if key.ID == apiKeyID {
			apiKey = &key
		}
	}

	if apiKey == nil {
		return errors.New("Invalid API key ID")
	}

	// retrieve api-keys from cache
	a.cache.Delete(string(apiKey.Digest[:]))

	return a.apiKeyRepository.DeleteAPIKey(apiKeyID)
}
