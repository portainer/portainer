package jwt

import (
	"github.com/portainer/portainer"

	"fmt"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/securecookie"
)

// Service represents a service for managing JWT tokens.
type Service struct {
	secret []byte
}

type claims struct {
	UserID   int    `json:"id"`
	Username string `json:"username"`
	Role     int    `json:"role"`
	jwt.StandardClaims
}

// NewService initializes a new service. It will generate a random key that will be used to sign JWT tokens.
func NewService() (*Service, error) {
	secret := securecookie.GenerateRandomKey(32)
	if secret == nil {
		return nil, portainer.ErrSecretGeneration
	}
	service := &Service{
		secret,
	}
	return service, nil
}

// GenerateToken generates a new JWT token.
func (service *Service) GenerateToken(data *portainer.TokenData) (string, error) {
	expireToken := time.Now().Add(time.Hour * 8).Unix()
	cl := claims{
		int(data.ID),
		data.Username,
		int(data.Role),
		jwt.StandardClaims{
			ExpiresAt: expireToken,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, cl)

	signedToken, err := token.SignedString(service.secret)
	if err != nil {
		return "", err
	}

	return signedToken, nil
}

// VerifyToken parses a JWT token and verify its validity. It returns an error if token is invalid.
func (service *Service) VerifyToken(token string) error {
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			msg := fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
			return nil, msg
		}
		return service.secret, nil
	})
	if err != nil || parsedToken == nil || !parsedToken.Valid {
		return portainer.ErrInvalidJWTToken
	}
	return nil
}
