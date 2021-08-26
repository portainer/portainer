package jwt

import (
	"errors"

	portainer "github.com/portainer/portainer/api"

	"fmt"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/securecookie"
)

// Service represents a service for managing JWT tokens.
type Service struct {
	secret             []byte
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

	service := &Service{
		secret,
		userSessionTimeout,
		dataStore,
	}
	return service, nil
}

func (service *Service) defaultExpireAt() (int64) {
	return time.Now().Add(service.userSessionTimeout).Unix()
}

// GenerateToken generates a new JWT token.
func (service *Service) GenerateToken(data *portainer.TokenData) (string, error) {
	return service.generateSignedToken(data, service.defaultExpireAt())
}

// GenerateTokenForOAuth generates a new JWT for OAuth login
// token expiry time from the OAuth provider is considered
func (service *Service) GenerateTokenForOAuth(data *portainer.TokenData, expiryTime *time.Time) (string, error) {
	expireAt := service.defaultExpireAt()
	if expiryTime != nil && !expiryTime.IsZero() {
		expireAt = expiryTime.Unix()
	}
	return service.generateSignedToken(data, expireAt)
}

// ParseAndVerifyToken parses a JWT token and verify its validity. It returns an error if token is invalid.
func (service *Service) ParseAndVerifyToken(token string) (*portainer.TokenData, error) {
	parsedToken, err := jwt.ParseWithClaims(token, &claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			msg := fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
			return nil, msg
		}
		return service.secret, nil
	})
	if err == nil && parsedToken != nil {
		if cl, ok := parsedToken.Claims.(*claims); ok && parsedToken.Valid {
			tokenData := &portainer.TokenData{
				ID:       portainer.UserID(cl.UserID),
				Username: cl.Username,
				Role:     portainer.UserRole(cl.Role),
			}
			return tokenData, nil
		}
	}

	return nil, errInvalidJWTToken
}

// SetUserSessionDuration sets the user session duration
func (service *Service) SetUserSessionDuration(userSessionDuration time.Duration) {
	service.userSessionTimeout = userSessionDuration
}

func (service *Service) generateSignedToken(data *portainer.TokenData, expiresAt int64) (string, error) {
	cl := claims{
		UserID:   int(data.ID),
		Username: data.Username,
		Role:     int(data.Role),
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expiresAt,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, cl)

	signedToken, err := token.SignedString(service.secret)
	if err != nil {
		return "", err
	}

	return signedToken, nil
}
