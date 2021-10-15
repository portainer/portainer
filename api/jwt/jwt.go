package jwt

import (
	"errors"
	"sync"

	portainer "github.com/portainer/portainer/api"

	"fmt"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/securecookie"
)

// Service represents a service for managing JWT tokens.
type Service struct {
	secret             []byte
	kubeSecret         []byte
	userSessionTimeout time.Duration
	dataStore          portainer.DataStore
}

type claims struct {
	UserID   int    `json:"id"`
	Username string `json:"username"`
	Role     int    `json:"role"`
	jwt.StandardClaims
}

var (
	errSecretGeneration = errors.New("Unable to generate secret key")
	errInvalidJWTToken  = errors.New("Invalid JWT token")
)

// NewService initializes a new service. It will generate a random key that will be used to sign JWT tokens.
func NewService(userSessionDuration string, dataStore portainer.DataStore) (*Service, error) {
	userSessionTimeout, err := time.ParseDuration(userSessionDuration)
	if err != nil {
		return nil, err
	}

	secret := securecookie.GenerateRandomKey(32)
	if secret == nil {
		return nil, errSecretGeneration
	}

	kubeSecret, err := getOrCreateKubeSecret(dataStore)
	if err != nil {
		return nil, err
	}

	service := &Service{
		secret,
		kubeSecret,
		userSessionTimeout,
		dataStore,
	}
	return service, nil
}

func getOrCreateKubeSecret(dataStore portainer.DataStore) ([]byte, error) {
	settings, err := dataStore.Settings().Settings()
	if err != nil {
		return nil, err
	}

	kubeSecret := settings.OAuthSettings.KubeSecretKey
	if kubeSecret == nil {
		kubeSecret = securecookie.GenerateRandomKey(32)
		if kubeSecret == nil {
			return nil, errSecretGeneration
		}
		settings.OAuthSettings.KubeSecretKey = kubeSecret
		err = dataStore.Settings().UpdateSettings(settings)
		if err != nil {
			return nil, err
		}
	}
	return kubeSecret, nil
}

func (service *Service) defaultExpireAt() int64 {
	return time.Now().Add(service.userSessionTimeout).Unix()
}

// GenerateToken generates a new JWT token.
func (service *Service) GenerateToken(data *portainer.TokenData) (string, error) {
	return service.generateSignedToken(data, service.defaultExpireAt(), service.secret)
}

// GenerateTokenForOAuth generates a new JWT for OAuth login
// token expiry time response from the OAuth provider is considered
func (service *Service) GenerateTokenForOAuth(data *portainer.TokenData, expiryTime *time.Time) (string, error) {
	expireAt := service.defaultExpireAt()
	if expiryTime != nil && !expiryTime.IsZero() {
		expireAt = expiryTime.Unix()
	}
	return service.generateSignedToken(data, expireAt, service.secret)
}

// ParseAndVerifyToken parses a JWT token and verify its validity. It returns an error if token is invalid.
func (service *Service) ParseAndVerifyToken(token string, isKube bool) (*portainer.TokenData, error) {
	wg := sync.WaitGroup{}
	secrets := [][]byte{
		service.secret,
	}
	if isKube {
		secrets = append(secrets, service.kubeSecret)
	}
	wg.Add(len(secrets))

	var result *portainer.TokenData
	for _, secret := range secrets {
		go func(secret []byte) {
			parsedToken := tryParseToken(token, secret)
			if parsedToken != nil {
				result = parsedToken
			}
			wg.Done()
		}(secret)
	}
	wg.Wait()

	if result == nil {
		return nil, errInvalidJWTToken
	}
	return result, nil
}

func tryParseToken(token string, secretKey []byte) *portainer.TokenData {
	parsedToken, err := jwt.ParseWithClaims(token, &claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			msg := fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			return nil, msg
		}
		return secretKey, nil
	})
	if err == nil && parsedToken != nil {
		if cl, ok := parsedToken.Claims.(*claims); ok && parsedToken.Valid {
			return &portainer.TokenData{
				ID:       portainer.UserID(cl.UserID),
				Username: cl.Username,
				Role:     portainer.UserRole(cl.Role),
			}
		}
	}
	return nil
}

// SetUserSessionDuration sets the user session duration
func (service *Service) SetUserSessionDuration(userSessionDuration time.Duration) {
	service.userSessionTimeout = userSessionDuration
}

func (service *Service)  generateSignedToken(data *portainer.TokenData, expiresAt int64, secret []byte) (string, error) {
	cl := claims{
		UserID:   int(data.ID),
		Username: data.Username,
		Role:     int(data.Role),
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expiresAt,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, cl)
	signedToken, err := token.SignedString(secret)
	if err != nil {
		return "", err
	}

	return signedToken, nil
}
