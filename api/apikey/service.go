package apikey

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"

	"github.com/pkg/errors"
)

const portainerAPIKeyPrefix = "ptr_"

var ErrInvalidAPIKey = errors.New("Invalid API key")

type apiKeyService struct {
	apiKeyRepository dataservices.APIKeyRepository
	userRepository   dataservices.UserService
	cache            *ApiKeyCache[portainer.User]
}

// GenerateRandomKey generates a random key of specified length
// source: https://github.com/gorilla/securecookie/blob/master/securecookie.go#L515
func GenerateRandomKey(length int) []byte {
	k := make([]byte, length)
	if _, err := io.ReadFull(rand.Reader, k); err != nil {
		return nil
	}

	return k
}

func compareUser(u portainer.User, id portainer.UserID) bool {
	return u.ID == id
}

func NewAPIKeyService(apiKeyRepository dataservices.APIKeyRepository, userRepository dataservices.UserService) *apiKeyService {
	return &apiKeyService{
		apiKeyRepository: apiKeyRepository,
		userRepository:   userRepository,
		cache:            NewAPIKeyCache(DefaultAPIKeyCacheSize, compareUser),
	}
}

// HashRaw computes a hash digest of provided raw API key.
func (a *apiKeyService) HashRaw(rawKey string) string {
	hashDigest := sha256.Sum256([]byte(rawKey))

	return base64.StdEncoding.EncodeToString(hashDigest[:])
}

// GenerateApiKey generates a raw API key for a user (for one-time display).
// The generated API key is stored in the cache and database.
func (a *apiKeyService) GenerateApiKey(user portainer.User, description string) (string, *portainer.APIKey, error) {
	randKey := GenerateRandomKey(32)
	encodedRawAPIKey := base64.StdEncoding.EncodeToString(randKey)
	prefixedAPIKey := portainerAPIKeyPrefix + encodedRawAPIKey
	hashDigest := a.HashRaw(prefixedAPIKey)

	apiKey := &portainer.APIKey{
		UserID:      user.ID,
		Description: description,
		Prefix:      prefixedAPIKey[:7],
		DateCreated: time.Now().Unix(),
		Digest:      hashDigest,
	}

	if err := a.apiKeyRepository.Create(apiKey); err != nil {
		return "", nil, errors.Wrap(err, "Unable to create API key")
	}

	// persist api-key to cache
	a.cache.Set(apiKey.Digest, user, *apiKey)

	return prefixedAPIKey, apiKey, nil
}

// GetAPIKey returns an API key by its ID.
func (a *apiKeyService) GetAPIKey(apiKeyID portainer.APIKeyID) (*portainer.APIKey, error) {
	return a.apiKeyRepository.Read(apiKeyID)
}

// GetAPIKeys returns all the API keys associated to a user.
func (a *apiKeyService) GetAPIKeys(userID portainer.UserID) ([]portainer.APIKey, error) {
	return a.apiKeyRepository.GetAPIKeysByUserID(userID)
}

// GetDigestUserAndKey returns the user and api-key associated to a specified hash digest.
// A cache lookup is performed first; if the user/api-key is not found in the cache, respective database lookups are performed.
func (a *apiKeyService) GetDigestUserAndKey(digest string) (portainer.User, portainer.APIKey, error) {
	cachedUser, cachedKey, ok := a.cache.Get(digest)
	if ok {
		return cachedUser, cachedKey, nil
	}

	apiKey, err := a.apiKeyRepository.GetAPIKeyByDigest(digest)
	if err != nil {
		return portainer.User{}, portainer.APIKey{}, errors.Wrap(err, "Unable to retrieve API key")
	}

	user, err := a.userRepository.Read(apiKey.UserID)
	if err != nil {
		return portainer.User{}, portainer.APIKey{}, errors.Wrap(err, "Unable to retrieve digest user")
	}

	// persist api-key to cache - for quicker future lookups
	a.cache.Set(apiKey.Digest, *user, *apiKey)

	return *user, *apiKey, nil
}

// UpdateAPIKey updates an API key and in cache and database.
func (a *apiKeyService) UpdateAPIKey(apiKey *portainer.APIKey) error {
	user, _, err := a.GetDigestUserAndKey(apiKey.Digest)
	if err != nil {
		return errors.Wrap(err, "Unable to retrieve API key")
	}

	a.cache.Set(apiKey.Digest, user, *apiKey)

	return a.apiKeyRepository.Update(apiKey.ID, apiKey)
}

// DeleteAPIKey deletes an API key and removes the digest/api-key entry from the cache.
func (a *apiKeyService) DeleteAPIKey(apiKeyID portainer.APIKeyID) error {
	apiKey, err := a.apiKeyRepository.Read(apiKeyID)
	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("Unable to retrieve API key: %d", apiKeyID))
	}

	a.cache.Delete(apiKey.Digest)

	return a.apiKeyRepository.Delete(apiKeyID)
}

func (a *apiKeyService) InvalidateUserKeyCache(userId portainer.UserID) bool {
	return a.cache.InvalidateUserKeyCache(userId)
}
