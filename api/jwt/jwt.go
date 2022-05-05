package jwt

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/gorilla/securecookie"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	log "github.com/sirupsen/logrus"
)

// scope represents JWT scopes that are supported in JWT claims.
type scope string

// Service represents a service for managing JWT tokens.
type Service struct {
	secrets            map[scope][]byte
	userSessionTimeout time.Duration
	dataStore          dataservices.DataStore
}

type claims struct {
	UserID              int    `json:"id"`
	Username            string `json:"username"`
	Role                int    `json:"role"`
	Scope               scope  `json:"scope"`
	ForceChangePassword bool   `json:"forceChangePassword"`
	jwt.StandardClaims
}

var (
	errSecretGeneration = errors.New("Unable to generate secret key")
	errInvalidJWTToken  = errors.New("Invalid JWT token")
)

const (
	defaultScope    = scope("default")
	kubeConfigScope = scope("kubeconfig")
)

// NewService initializes a new service. It will generate a random key that will be used to sign JWT tokens.
func NewService(userSessionDuration string, dataStore dataservices.DataStore) (*Service, error) {
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
		map[scope][]byte{
			defaultScope:    secret,
			kubeConfigScope: kubeSecret,
		},
		userSessionTimeout,
		dataStore,
	}
	return service, nil
}

func getOrCreateKubeSecret(dataStore dataservices.DataStore) ([]byte, error) {
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
	return service.generateSignedToken(data, service.defaultExpireAt(), defaultScope)
}

// GenerateTokenForOAuth generates a new JWT token for OAuth login
// token expiry time response from OAuth provider is considered
func (service *Service) GenerateTokenForOAuth(data *portainer.TokenData, expiryTime *time.Time) (string, error) {
	expireAt := service.defaultExpireAt()
	if expiryTime != nil && !expiryTime.IsZero() {
		expireAt = expiryTime.Unix()
	}
	return service.generateSignedToken(data, expireAt, defaultScope)
}

// ParseAndVerifyToken parses a JWT token and verify its validity. It returns an error if token is invalid.
func (service *Service) ParseAndVerifyToken(token string) (*portainer.TokenData, error) {
	scope := parseScope(token)
	secret := service.secrets[scope]
	parsedToken, err := jwt.ParseWithClaims(token, &claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			msg := fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			return nil, msg
		}
		return secret, nil
	})

	if err == nil && parsedToken != nil {
		if cl, ok := parsedToken.Claims.(*claims); ok && parsedToken.Valid {

			user, err := service.dataStore.User().User(portainer.UserID(cl.UserID))
			if err != nil {
				return nil, errInvalidJWTToken
			}
			if user.TokenIssueAt > cl.StandardClaims.IssuedAt {
				return nil, errInvalidJWTToken
			}
			return &portainer.TokenData{
				ID:       portainer.UserID(cl.UserID),
				Username: cl.Username,
				Role:     portainer.UserRole(cl.Role),
			}, nil
		}
	}
	return nil, errInvalidJWTToken
}

// parse a JWT token, fallback to defaultScope if no scope is present in the JWT
func parseScope(token string) scope {
	unverifiedToken, _, _ := new(jwt.Parser).ParseUnverified(token, &claims{})
	if unverifiedToken != nil {
		if cl, ok := unverifiedToken.Claims.(*claims); ok {
			if cl.Scope == kubeConfigScope {
				return kubeConfigScope
			}
		}
	}
	return defaultScope
}

// SetUserSessionDuration sets the user session duration
func (service *Service) SetUserSessionDuration(userSessionDuration time.Duration) {
	service.userSessionTimeout = userSessionDuration
}

func (service *Service) generateSignedToken(data *portainer.TokenData, expiresAt int64, scope scope) (string, error) {
	secret, found := service.secrets[scope]
	if !found {
		return "", fmt.Errorf("invalid scope: %v", scope)
	}

	if _, ok := os.LookupEnv("DOCKER_EXTENSION"); ok {
		// Set expiration to 99 years for docker desktop extension.
		log.Infof("[message: detected docker desktop extension mode]")
		expiresAt = time.Now().Add(time.Hour * 8760 * 99).Unix()
	}

	cl := claims{
		UserID:              int(data.ID),
		Username:            data.Username,
		Role:                int(data.Role),
		Scope:               scope,
		ForceChangePassword: data.ForceChangePassword,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expiresAt,
			IssuedAt:  time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, cl)
	signedToken, err := token.SignedString(secret)
	if err != nil {
		return "", err
	}

	return signedToken, nil
}
