package security

import (
	"net/http"
	"strings"
	"sync"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/dataservices"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/pkg/featureflags"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

const apiKeyHeader = "X-API-KEY"
const jwtTokenHeader = "Authorization"

type (
	BouncerService interface {
		PublicAccess(http.Handler) http.Handler
		AdminAccess(http.Handler) http.Handler
		RestrictedAccess(http.Handler) http.Handler
		TeamLeaderAccess(http.Handler) http.Handler
		AuthenticatedAccess(http.Handler) http.Handler
		EdgeComputeOperation(http.Handler) http.Handler

		AuthorizedEndpointOperation(*http.Request, *portainer.Endpoint) error
		AuthorizedEdgeEndpointOperation(*http.Request, *portainer.Endpoint) error
		CookieAuthLookup(*http.Request) (*portainer.TokenData, error)
		JWTAuthLookup(*http.Request) (*portainer.TokenData, error)
		TrustedEdgeEnvironmentAccess(dataservices.DataStoreTx, *portainer.Endpoint) error
		RevokeJWT(string)
	}

	// RequestBouncer represents an entity that manages API request accesses
	RequestBouncer struct {
		dataStore     dataservices.DataStore
		jwtService    portainer.JWTService
		apiKeyService apikey.APIKeyService
		revokedJWT    sync.Map
		hsts          bool
		csp           bool
	}

	// RestrictedRequestContext is a data structure containing information
	// used in AuthenticatedAccess
	RestrictedRequestContext struct {
		IsAdmin         bool
		IsTeamLeader    bool
		UserID          portainer.UserID
		UserMemberships []portainer.TeamMembership
	}

	// tokenLookup looks up a token in the request
	tokenLookup func(*http.Request) (*portainer.TokenData, error)
)

var (
	ErrInvalidKey = errors.New("Invalid API key")
	ErrRevokedJWT = errors.New("the JWT has been revoked")
)

// NewRequestBouncer initializes a new RequestBouncer
func NewRequestBouncer(dataStore dataservices.DataStore, jwtService portainer.JWTService, apiKeyService apikey.APIKeyService) *RequestBouncer {
	b := &RequestBouncer{
		dataStore:     dataStore,
		jwtService:    jwtService,
		apiKeyService: apiKeyService,
		hsts:          featureflags.IsEnabled("hsts"),
		csp:           featureflags.IsEnabled("csp"),
	}

	go b.cleanUpExpiredJWT()

	return b
}

// PublicAccess defines a security check for public API endpoints.
// No authentication is required to access these endpoints.
func (bouncer *RequestBouncer) PublicAccess(h http.Handler) http.Handler {
	return MWSecureHeaders(h, bouncer.hsts, bouncer.csp)
}

// AdminAccess defines a security check for API endpoints that require an authorization check.
// Authentication is required to access these endpoints.
// The administrator role is required to use these endpoints.
// The request context will be enhanced with a RestrictedRequestContext object
// that might be used later to inside the API operation for extra authorization validation
// and resource filtering.
func (bouncer *RequestBouncer) AdminAccess(h http.Handler) http.Handler {
	h = bouncer.mwUpgradeToRestrictedRequest(h)
	h = bouncer.mwCheckPortainerAuthorizations(h, true)
	h = bouncer.mwAuthenticatedUser(h)

	return h
}

// RestrictedAccess defines a security check for restricted API endpoints.
// Authentication is required to access these endpoints.
// The request context will be enhanced with a RestrictedRequestContext object
// that might be used later to inside the API operation for extra authorization validation
// and resource filtering.
func (bouncer *RequestBouncer) RestrictedAccess(h http.Handler) http.Handler {
	h = bouncer.mwUpgradeToRestrictedRequest(h)
	h = bouncer.mwCheckPortainerAuthorizations(h, false)
	h = bouncer.mwAuthenticatedUser(h)

	return h
}

// TeamLeaderAccess defines a security check for APIs require team leader privilege
//
// Bouncer operations are applied backwards:
//   - Parse the JWT from the request and stored in context, user has to be authenticated
//   - Upgrade to the restricted request
//   - User is admin or team leader
func (bouncer *RequestBouncer) TeamLeaderAccess(h http.Handler) http.Handler {
	h = bouncer.mwIsTeamLeader(h)
	h = bouncer.mwUpgradeToRestrictedRequest(h)
	h = bouncer.mwAuthenticatedUser(h)

	return h
}

// AuthenticatedAccess defines a security check for restricted API endpoints.
// Authentication is required to access these endpoints.
// The request context will be enhanced with a RestrictedRequestContext object
// that might be used later to inside the API operation for extra authorization validation
// and resource filtering.
func (bouncer *RequestBouncer) AuthenticatedAccess(h http.Handler) http.Handler {
	h = bouncer.mwUpgradeToRestrictedRequest(h)
	h = bouncer.mwAuthenticatedUser(h)

	return h
}

// AuthorizedEndpointOperation retrieves the JWT token from the request context and verifies
// that the user can access the specified environment(endpoint).
// An error is returned when access to the environments(endpoints) is denied or if the user do not have the required
// authorization to execute the operation.
func (bouncer *RequestBouncer) AuthorizedEndpointOperation(r *http.Request, endpoint *portainer.Endpoint) error {
	tokenData, err := RetrieveTokenData(r)
	if err != nil {
		return err
	}

	if tokenData.Role == portainer.AdministratorRole {
		return nil
	}

	memberships, err := bouncer.dataStore.TeamMembership().TeamMembershipsByUserID(tokenData.ID)
	if err != nil {
		return err
	}

	group, err := bouncer.dataStore.EndpointGroup().Read(endpoint.GroupID)
	if err != nil {
		return err
	}

	if !AuthorizedEndpointAccess(endpoint, group, tokenData.ID, memberships) {
		return httperrors.ErrEndpointAccessDenied
	}

	return nil
}

// AuthorizedEdgeEndpointOperation verifies that the request was received from a valid Edge environment(endpoint)
func (bouncer *RequestBouncer) AuthorizedEdgeEndpointOperation(r *http.Request, endpoint *portainer.Endpoint) error {
	if endpoint.Type != portainer.EdgeAgentOnKubernetesEnvironment && endpoint.Type != portainer.EdgeAgentOnDockerEnvironment {
		return errors.New("Invalid environment type")
	}

	edgeIdentifier := r.Header.Get(portainer.PortainerAgentEdgeIDHeader)
	if edgeIdentifier == "" {
		return errors.New("missing Edge identifier")
	}

	if endpoint.EdgeID != "" && endpoint.EdgeID != edgeIdentifier {
		return errors.New("invalid Edge identifier")
	}

	return nil
}

// TrustedEdgeEnvironmentAccess defines a security check for Edge environments, checks if
// the request is coming from a trusted Edge environment
func (bouncer *RequestBouncer) TrustedEdgeEnvironmentAccess(tx dataservices.DataStoreTx, endpoint *portainer.Endpoint) error {
	if endpoint.UserTrusted {
		return nil
	}

	settings, err := tx.Settings().Settings()
	if err != nil {
		return errors.WithMessage(err, "could not retrieve the settings")
	}

	if !settings.TrustOnFirstConnect {
		return errors.New("the device has not been trusted yet")
	}

	return nil
}

// mwAuthenticatedUser authenticates a request by
// - adding a secure handlers to the response
// - authenticating the request with a valid token
func (bouncer *RequestBouncer) mwAuthenticatedUser(h http.Handler) http.Handler {
	h = bouncer.mwAuthenticateFirst([]tokenLookup{
		bouncer.apiKeyLookup,
		bouncer.CookieAuthLookup,
		bouncer.JWTAuthLookup,
	}, h)
	h = MWSecureHeaders(h, bouncer.hsts, bouncer.csp)

	return h
}

// mwCheckPortainerAuthorizations will verify that the user has the required authorization to access
// a specific API environment(endpoint).
// If the administratorOnly flag is specified, this will prevent non-admin
// users from accessing the environment(endpoint).
func (bouncer *RequestBouncer) mwCheckPortainerAuthorizations(next http.Handler, administratorOnly bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenData, err := RetrieveTokenData(r)
		if err != nil {
			httperror.WriteError(w, http.StatusForbidden, "Access denied", httperrors.ErrUnauthorized)
			return
		}

		if tokenData.Role == portainer.AdministratorRole {
			next.ServeHTTP(w, r)
			return
		}

		if administratorOnly {
			httperror.WriteError(w, http.StatusForbidden, "Access denied", httperrors.ErrUnauthorized)
			return
		}

		if ok, err := bouncer.dataStore.User().Exists(tokenData.ID); !ok {
			httperror.WriteError(w, http.StatusUnauthorized, "Unauthorized", httperrors.ErrUnauthorized)
			return
		} else if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable to retrieve user details from the database", err)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// mwUpgradeToRestrictedRequest will enhance the current request with
// a new RestrictedRequestContext object.
func (bouncer *RequestBouncer) mwUpgradeToRestrictedRequest(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenData, err := RetrieveTokenData(r)
		if err != nil {
			httperror.WriteError(w, http.StatusForbidden, "Access denied", httperrors.ErrResourceAccessDenied)
			return
		}

		requestContext, err := bouncer.newRestrictedContextRequest(tokenData.ID, tokenData.Role)
		if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable to create restricted request context ", err)
			return
		}

		ctx := StoreRestrictedRequestContext(r, requestContext)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// mwIsTeamLeader will verify that the user is an admin or a team leader
func (bouncer *RequestBouncer) mwIsTeamLeader(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		securityContext, err := RetrieveRestrictedRequestContext(r)
		if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable to retrieve restricted request context ", err)
			return
		}

		if !securityContext.IsAdmin && !securityContext.IsTeamLeader {
			httperror.WriteError(w, http.StatusForbidden, "Access denied", httperrors.ErrUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// mwAuthenticateFirst authenticates a request an auth token.
// A result of a first succeeded token lookup would be used for the authentication.
func (bouncer *RequestBouncer) mwAuthenticateFirst(tokenLookups []tokenLookup, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var token *portainer.TokenData

		for _, lookup := range tokenLookups {
			resultToken, err := lookup(r)
			if err != nil {
				httperror.WriteError(w, http.StatusUnauthorized, "Invalid JWT token", httperrors.ErrUnauthorized)

				return
			}

			if resultToken != nil {
				token = resultToken

				break
			}
		}

		if token == nil {
			httperror.WriteError(w, http.StatusUnauthorized, "A valid authorization token is missing", httperrors.ErrUnauthorized)

			return
		}

		if ok, _ := bouncer.dataStore.User().Exists(token.ID); !ok {
			httperror.WriteError(w, http.StatusUnauthorized, "The authorization token is invalid", httperrors.ErrUnauthorized)

			return
		}

		ctx := StoreTokenData(r, token)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// JWTAuthLookup looks up a valid bearer in the request.
func (bouncer *RequestBouncer) CookieAuthLookup(r *http.Request) (*portainer.TokenData, error) {
	// get token from the Authorization header or query parameter
	token, err := extractKeyFromCookie(r)
	if err != nil {
		return nil, nil
	}

	tokenData, jti, _, err := bouncer.jwtService.ParseAndVerifyToken(token)
	if err != nil {
		return nil, err
	}

	if _, ok := bouncer.revokedJWT.Load(jti); ok {
		return nil, ErrRevokedJWT
	}

	return tokenData, nil
}

// JWTAuthLookup looks up a valid bearer in the request.
func (bouncer *RequestBouncer) JWTAuthLookup(r *http.Request) (*portainer.TokenData, error) {
	// get token from the Authorization header or query parameter
	token, ok := extractBearerToken(r)
	if !ok {
		return nil, nil
	}

	tokenData, jti, _, err := bouncer.jwtService.ParseAndVerifyToken(token)
	if err != nil {
		return nil, err
	}

	if _, ok := bouncer.revokedJWT.Load(jti); ok {
		return nil, ErrRevokedJWT
	}

	return tokenData, nil
}

func (bouncer *RequestBouncer) RevokeJWT(token string) {
	_, jti, exp, err := bouncer.jwtService.ParseAndVerifyToken(token)
	if err != nil {
		return
	}

	bouncer.revokedJWT.Store(jti, exp)
}

func (bouncer *RequestBouncer) cleanUpExpiredJWTPass() {
	bouncer.revokedJWT.Range(func(key, value any) bool {
		if t := value.(time.Time); t.IsZero() {
			return true
		} else if time.Now().After(t) {
			bouncer.revokedJWT.Delete(key)
		}

		return true
	})
}

func (bouncer *RequestBouncer) cleanUpExpiredJWT() {
	ticker := time.NewTicker(time.Hour)

	for range ticker.C {
		bouncer.cleanUpExpiredJWTPass()
	}
}

// apiKeyLookup looks up an verifies an api-key by:
// - computing the digest of the raw api-key
// - verifying it exists in cache/database
// - matching the key to a user (ID, Role)
// If the key is valid/verified, the last updated time of the key is updated.
// Successful verification of the key will return a TokenData object - since the downstream handlers
// utilise the token injected in the request context.
func (bouncer *RequestBouncer) apiKeyLookup(r *http.Request) (*portainer.TokenData, error) {
	rawAPIKey, ok := extractAPIKey(r)
	if !ok {
		return nil, nil
	}

	digest := bouncer.apiKeyService.HashRaw(rawAPIKey)

	user, apiKey, err := bouncer.apiKeyService.GetDigestUserAndKey(digest)
	if err != nil {
		return nil, ErrInvalidKey
	}

	tokenData := &portainer.TokenData{
		ID:       user.ID,
		Username: user.Username,
		Role:     user.Role,
	}
	if _, _, err := bouncer.jwtService.GenerateToken(tokenData); err != nil {
		log.Debug().Err(err).Msg("Failed to generate token")
		return nil, errors.New("failed to generate token")
	}

	if now := time.Now().UTC().Unix(); now-apiKey.LastUsed > 60 { // [seconds]
		// update the last used time of the key
		apiKey.LastUsed = now
		_ = bouncer.apiKeyService.UpdateAPIKey(&apiKey)
	}

	return tokenData, nil
}

// extractBearerToken extracts the Bearer token from the request header or query parameter and returns the token.
func extractBearerToken(r *http.Request) (string, bool) {
	// Token might be set via the "token" query parameter.
	// For example, in websocket requests
	// For these cases, hide the token from the query
	query := r.URL.Query()
	token := query.Get("token")
	if token != "" {
		query.Del("token")
		r.URL.RawQuery = query.Encode()

		return token, true
	}

	tokens, ok := r.Header[jwtTokenHeader]
	if !ok || len(tokens) == 0 {
		return "", false
	}

	token = tokens[0]
	token = strings.TrimPrefix(token, "Bearer ")

	return token, true
}

// AddAuthCookie adds the jwt token to the response cookie.
func AddAuthCookie(w http.ResponseWriter, token string, expirationTime time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name:     portainer.AuthCookieKey,
		Value:    token,
		Path:     "/",
		Expires:  expirationTime,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})
}

// RemoveAuthCookie removes the jwt token from the response cookie.
func RemoveAuthCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     portainer.AuthCookieKey,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		MaxAge:   -1,
		SameSite: http.SameSiteStrictMode,
	})
}

// extractKeyFromCookie extracts the jwt token from the cookie.
func extractKeyFromCookie(r *http.Request) (string, error) {
	cookie, err := r.Cookie(portainer.AuthCookieKey)
	if err != nil {
		return "", err
	}

	return cookie.Value, nil
}

// extractAPIKey extracts the api key from the api key request header or query params.
func extractAPIKey(r *http.Request) (string, bool) {
	// extract the API key from the request header
	apiKey := r.Header.Get(apiKeyHeader)
	if apiKey != "" {
		return apiKey, true
	}

	// extract the API key from query params.
	// Case-insensitive check for the "X-API-KEY" query param.
	query := r.URL.Query()
	for k, v := range query {
		if strings.EqualFold(k, apiKeyHeader) {
			return v[0], true
		}
	}

	return "", false
}

// MWSecureHeaders provides secure headers middleware for handlers.
func MWSecureHeaders(next http.Handler, hsts, csp bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if hsts {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000") // 365 days
		}

		if csp {
			w.Header().Set("Content-Security-Policy", "script-src 'self' cdn.matomo.cloud")
		}

		w.Header().Set("X-Content-Type-Options", "nosniff")
		next.ServeHTTP(w, r)
	})
}

func (bouncer *RequestBouncer) newRestrictedContextRequest(userID portainer.UserID, userRole portainer.UserRole) (*RestrictedRequestContext, error) {
	if userRole == portainer.AdministratorRole {
		return &RestrictedRequestContext{
			IsAdmin: true,
			UserID:  userID,
		}, nil
	}

	memberships, err := bouncer.dataStore.TeamMembership().TeamMembershipsByUserID(userID)
	if err != nil {
		return nil, err
	}

	isTeamLeader := false
	for _, membership := range memberships {
		if membership.Role == portainer.TeamLeader {
			isTeamLeader = true
		}
	}

	return &RestrictedRequestContext{
		IsAdmin:         false,
		UserID:          userID,
		IsTeamLeader:    isTeamLeader,
		UserMemberships: memberships,
	}, nil
}

// EdgeComputeOperation defines a restricted edge compute operation.
// Use of this operation will only be authorized if edgeCompute is enabled in settings
func (bouncer *RequestBouncer) EdgeComputeOperation(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		settings, err := bouncer.dataStore.Settings().Settings()
		if err != nil {
			httperror.WriteError(w, http.StatusServiceUnavailable, "Unable to retrieve settings", err)

			return
		}

		if !settings.EnableEdgeComputeFeatures {
			httperror.WriteError(w, http.StatusServiceUnavailable, "Edge compute features are disabled", errors.New("Edge compute features are disabled"))

			return
		}

		next.ServeHTTP(w, r)
	})
}

// ShouldSkipCSRFCheck checks if the CSRF check should be skipped
//
// It returns true if the request has no cookie token and has either (but not both):
// - an api key header
// - an auth header
// if it has both headers, an error is returned
//
// we allow CSRF check to be skipped for the following reasons:
// - public routes
// - kubectl - a bearer token is needed, and no csrf token can be sent
// - api token
// - docker desktop extension
func ShouldSkipCSRFCheck(r *http.Request, isDockerDesktopExtension bool) (bool, error) {
	if isDockerDesktopExtension {
		return true, nil
	}

	cookie, _ := r.Cookie(portainer.AuthCookieKey)
	hasCookie := cookie != nil && cookie.Value != ""

	if hasCookie {
		return false, nil
	}

	apiKey := r.Header.Get(apiKeyHeader)
	hasApiKey := apiKey != ""

	authHeader := r.Header.Get(jwtTokenHeader)
	hasAuthHeader := authHeader != ""

	if hasApiKey && hasAuthHeader {
		return false, errors.New("api key and auth header are not allowed at the same time")
	}

	return true, nil
}
