package jwt

import (
	"errors"
	"fmt"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/dataservices"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
)

const (
	year = time.Hour * 24 * 365

	keyLen = 32
)

// Service represents a service for managing JWT tokens.
type Service struct {
	secrets            map[portainer.TokenScope][]byte
	userSessionTimeout time.Duration
	dataStore          dataservices.DataStore
}

type claims struct {
	UserID              int                  `json:"id"`
	Username            string               `json:"username"`
	Role                int                  `json:"role"`
	Scope               portainer.TokenScope `json:"scope"`
	EndpointID          portainer.EndpointID `json:"endpoint,omitempty"`
	ForceChangePassword bool                 `json:"forceChangePassword"`
	jwt.RegisteredClaims
}

var (
	errSecretGeneration = errors.New("unable to generate secret key")
	errInvalidJWTToken  = errors.New("invalid JWT token")
)

// NewService initializes a new service. It will generate a random key that will be used to sign JWT tokens.
func NewService(userSessionDuration string, dataStore dataservices.DataStore) (*Service, error) {
	userSessionTimeout, err := time.ParseDuration(userSessionDuration)
	if err != nil {
		return nil, err
	}

	secret := apikey.GenerateRandomKey(keyLen)
	if secret == nil {
		return nil, errSecretGeneration
	}

	kubeSecret, err := getOrCreateKubeSecret(dataStore)
	if err != nil {
		return nil, err
	}

	return &Service{
		map[portainer.TokenScope][]byte{
			portainer.DefaultTokenScope:    secret,
			portainer.KubeconfigTokenScope: kubeSecret,
		},
		userSessionTimeout,
		dataStore,
	}, nil
}

func getOrCreateKubeSecret(dataStore dataservices.DataStore) ([]byte, error) {
	settings, err := dataStore.Settings().Settings()
	if err != nil {
		return nil, err
	}

	kubeSecret := settings.OAuthSettings.KubeSecretKey
	if kubeSecret != nil {
		return kubeSecret, nil
	}

	kubeSecret = apikey.GenerateRandomKey(keyLen)
	if kubeSecret == nil {
		return nil, errSecretGeneration
	}

	settings.OAuthSettings.KubeSecretKey = kubeSecret

	if err := dataStore.Settings().UpdateSettings(settings); err != nil {
		return nil, err
	}

	return kubeSecret, nil
}

func (service *Service) defaultExpireAt() time.Time {
	return time.Now().Add(service.userSessionTimeout)
}

// GenerateToken generates a new JWT token.
func (service *Service) GenerateToken(data *portainer.TokenData) (string, time.Time, error) {
	expiryTime := service.defaultExpireAt()
	token, err := service.generateSignedToken(data, expiryTime, portainer.DefaultTokenScope, portainer.UnscopedToken)

	return token, expiryTime, err
}

// ParseAndVerifyToken parses a JWT token and verify its validity. It returns an error if token is invalid.
func (service *Service) ParseAndVerifyToken(token string) (*portainer.ScopedTokenData, string, time.Time, error) {
	// The scope only selects the signing secret here. The claim itself is
	// trustworthy once the signature below verifies against that secret.
	secret := service.secrets[parseScope(token)]

	parsedToken, err := jwt.ParseWithClaims(token, &claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return secret, nil
	})
	if err != nil || parsedToken == nil {
		return nil, "", time.Time{}, errInvalidJWTToken
	}

	cl, ok := parsedToken.Claims.(*claims)
	if !ok || !parsedToken.Valid {
		return nil, "", time.Time{}, errInvalidJWTToken
	}

	user, err := service.dataStore.User().Read(portainer.UserID(cl.UserID))
	if err != nil || user.TokenIssueAt > cl.IssuedAt.Unix() {
		return nil, "", time.Time{}, errInvalidJWTToken
	}

	if cl.ExpiresAt == nil {
		cl.ExpiresAt = &jwt.NumericDate{}
	}

	return &portainer.ScopedTokenData{
		TokenData: &portainer.TokenData{
			ID:                  portainer.UserID(cl.UserID),
			Username:            cl.Username,
			Role:                portainer.UserRole(cl.Role),
			Token:               token,
			ForceChangePassword: cl.ForceChangePassword,
		},
		Scope:      verifiedScope(cl.Scope),
		EndpointID: cl.EndpointID,
	}, cl.ID, cl.ExpiresAt.Time, nil
}

// ParseAndVerifySessionToken parses and verifies a user session token. A token
// carrying any other scope is refused, so a kubeconfig token is never accepted
// as a session.
func (service *Service) ParseAndVerifySessionToken(token string) (*portainer.TokenData, string, time.Time, error) {
	tokenData, jti, expiresAt, err := service.ParseAndVerifyToken(token)
	if err != nil {
		return nil, "", time.Time{}, err
	}

	if tokenData.Scope != portainer.DefaultTokenScope {
		return nil, "", time.Time{}, errInvalidJWTToken
	}

	return tokenData.TokenData, jti, expiresAt, nil
}

// verifiedScope is the token's own scope claim, carried through once the
// signature has been checked. Tokens predating scopes have no claim and are
// session tokens.
func verifiedScope(claimed portainer.TokenScope) portainer.TokenScope {
	if claimed == "" {
		return portainer.DefaultTokenScope
	}

	return claimed
}

// Parse a JWT token, fallback to the default scope if no scope is present in the JWT
func parseScope(token string) portainer.TokenScope {
	unverifiedToken, _, _ := new(jwt.Parser).ParseUnverified(token, &claims{})
	if unverifiedToken == nil {
		return portainer.DefaultTokenScope
	}

	if cl, ok := unverifiedToken.Claims.(*claims); ok && cl.Scope == portainer.KubeconfigTokenScope {
		return portainer.KubeconfigTokenScope
	}

	return portainer.DefaultTokenScope
}

// SetUserSessionDuration sets the user session duration
func (service *Service) SetUserSessionDuration(userSessionDuration time.Duration) {
	service.userSessionTimeout = userSessionDuration
}

func (service *Service) generateSignedToken(data *portainer.TokenData, expiresAt time.Time, tokenScope portainer.TokenScope, endpointID portainer.EndpointID) (string, error) {
	secret, found := service.secrets[tokenScope]
	if !found {
		return "", fmt.Errorf("invalid scope: %v", tokenScope)
	}

	settings, err := service.dataStore.Settings().Settings()
	if err != nil {
		return "", fmt.Errorf("failed fetching settings from db: %w", err)
	}

	if settings.IsDockerDesktopExtension {
		log.Info().Msg("detected docker desktop extension mode")
		expiresAt = time.Now().Add(99 * year)
	}

	uuid, err := uuid.NewRandom()
	if err != nil {
		return "", fmt.Errorf("unable to generate the JWT ID: %w", err)
	}

	cl := claims{
		UserID:              int(data.ID),
		Username:            data.Username,
		Role:                int(data.Role),
		Scope:               tokenScope,
		EndpointID:          endpointID,
		ForceChangePassword: data.ForceChangePassword,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        uuid.String(),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	// If expiresAt is set to a zero value, the token should never expire
	if expiresAt.IsZero() {
		cl.ExpiresAt = nil
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, cl)

	return token.SignedString(secret)
}
