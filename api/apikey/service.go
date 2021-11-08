package apikey

import (
	"crypto/sha256"
	"encoding/base64"
	"time"

	"github.com/gorilla/securecookie"
	"github.com/pkg/errors"

	portainer "github.com/portainer/portainer/api"
)

var ErrInvalidAPIKey = errors.New("Invalid API key")

type apiKeyService struct {
	apiKeyRepository portainer.APIKeyRepository
	userRepository   portainer.UserService
	cache            *apiKeyCache
}

func NewAPIKeyService(apiKeyRepository portainer.APIKeyRepository, userRepository portainer.UserService) *apiKeyService {
	return &apiKeyService{
		apiKeyRepository: apiKeyRepository,
		userRepository:   userRepository,
		cache:            NewAPIKeyCache(time.Hour),
	}
}

// HashRaw computes a hash digest of provided base64 encoded raw API key.
func (a *apiKeyService) HashRaw(rawKey string) ([]byte, error) {
	decodedRawAPIKey, err := base64.StdEncoding.DecodeString(rawKey)
	if err != nil {
		return nil, errors.Wrap(err, "Unable to decode raw API key")
	}
	hashDigest := sha256.Sum256(decodedRawAPIKey)
	return hashDigest[:], nil
}

// GenerateApiKey generates a base64 encoded raw API key for a user (for one-time display).
// The generated API key is stored in the cache and database.
func (a *apiKeyService) GenerateApiKey(user portainer.User, description string) (string, *portainer.APIKey, error) {
	rawAPIKey := securecookie.GenerateRandomKey(32)
	encodedRawAPIKey := base64.StdEncoding.EncodeToString(rawAPIKey)
	hashDigest := sha256.Sum256(rawAPIKey)

	apiKey := &portainer.APIKey{
		UserID:      user.ID,
		Description: description,
		Prefix:      encodedRawAPIKey[:3],
		DateCreated: time.Now(),
		Digest:      hashDigest[:],
	}

	err := a.apiKeyRepository.CreateAPIKey(apiKey)
	if err != nil {
		return "", nil, errors.Wrap(err, "Unable to create API key")
	}

	// persist api-key to cache
	a.cache.Set(apiKey.Digest, user, *apiKey)

	return encodedRawAPIKey, apiKey, nil
}

// GetAPIKeys returns all the API keys associated to a user.
func (a *apiKeyService) GetAPIKeys(userID portainer.UserID) ([]portainer.APIKey, error) {
	return a.apiKeyRepository.GetAPIKeysByUserID(userID)
}

// GetDigestUserAndKey returns the user and api-key associated to a specified hash digest.
// A cache lookup is performed first; if the user/api-key is not found in the cache, respective database lookups are performed.
func (a *apiKeyService) GetDigestUserAndKey(digest []byte) (portainer.User, portainer.APIKey, error) {
	// get api key from cache if possible
	cachedUser, cachedKey, ok := a.cache.Get(digest)
	if ok {
		return cachedUser, cachedKey, nil
	}

	apiKey, err := a.apiKeyRepository.GetAPIKeyByDigest(digest)
	if err != nil {
		return portainer.User{}, portainer.APIKey{}, errors.Wrap(err, "Unable to retrieve API key")
	}

	user, err := a.userRepository.User(apiKey.UserID)
	if err != nil {
		return portainer.User{}, portainer.APIKey{}, errors.Wrap(err, "Unable to retrieve digest user")
	}

	// persist api-key to cache - for quicker future lookups
	a.cache.Set(apiKey.Digest, *user, *apiKey)

	return *user, *apiKey, nil
}

// UpdateAPIKey updates an API key and clears the user/api-key cache entry for the digest.
func (a *apiKeyService) UpdateAPIKey(apiKey *portainer.APIKey) error {
	a.cache.Delete(apiKey.Digest)
	return a.apiKeyRepository.UpdateAPIKey(apiKey)
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
		return ErrInvalidAPIKey
	}

	// delete the user/api-key from cache
	a.cache.Delete(apiKey.Digest)

	return a.apiKeyRepository.DeleteAPIKey(apiKeyID)
}
