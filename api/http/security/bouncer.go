package security

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/dataservices"
	httperrors "github.com/portainer/portainer/api/http/errors"
)

type (
	// RequestBouncer represents an entity that manages API request accesses
	RequestBouncer struct {
		dataStore     dataservices.DataStore
		jwtService    dataservices.JWTService
		apiKeyService apikey.APIKeyService
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
	tokenLookup func(*http.Request) *portainer.TokenData
)

const apiKeyHeader = "X-API-KEY"

// NewRequestBouncer initializes a new RequestBouncer
func NewRequestBouncer(dataStore dataservices.DataStore, jwtService dataservices.JWTService, apiKeyService apikey.APIKeyService) *RequestBouncer {
	return &RequestBouncer{
		dataStore:     dataStore,
		jwtService:    jwtService,
		apiKeyService: apiKeyService,
	}
}

// PublicAccess defines a security check for public API environments(endpoints).
// No authentication is required to access these environments(endpoints).
func (bouncer *RequestBouncer) PublicAccess(h http.Handler) http.Handler {
	h = mwSecureHeaders(h)
	return h
}

// AdminAccess defines a security check for API environments(endpoints) that require an authorization check.
// Authentication is required to access these environments(endpoints).
// The administrator role is required to use these environments(endpoints).
// The request context will be enhanced with a RestrictedRequestContext object
// that might be used later to inside the API operation for extra authorization validation
// and resource filtering.
func (bouncer *RequestBouncer) AdminAccess(h http.Handler) http.Handler {
	h = bouncer.mwUpgradeToRestrictedRequest(h)
	h = bouncer.mwCheckPortainerAuthorizations(h, true)
	h = bouncer.mwAuthenticatedUser(h)
	return h
}

// RestrictedAccess defines a security check for restricted API environments(endpoints).
// Authentication is required to access these environments(endpoints).
// The request context will be enhanced with a RestrictedRequestContext object
// that might be used later to inside the API operation for extra authorization validation
// and resource filtering.
func (bouncer *RequestBouncer) RestrictedAccess(h http.Handler) http.Handler {
	h = bouncer.mwUpgradeToRestrictedRequest(h)
	h = bouncer.mwCheckPortainerAuthorizations(h, false)
	h = bouncer.mwAuthenticatedUser(h)
	return h
}

// AuthenticatedAccess defines a security check for restricted API environments(endpoints).
// Authentication is required to access these environments(endpoints).
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

	group, err := bouncer.dataStore.EndpointGroup().EndpointGroup(endpoint.GroupID)
	if err != nil {
		return err
	}

	if !authorizedEndpointAccess(endpoint, group, tokenData.ID, memberships) {
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

	if endpoint.LastCheckInDate > 0 || endpoint.UserTrusted {
		return nil
	}

	settings, err := bouncer.dataStore.Settings().Settings()
	if err != nil {
		return fmt.Errorf("could not retrieve the settings: %w", err)
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
		bouncer.JWTAuthLookup,
		bouncer.apiKeyLookup,
	}, h)
	h = mwSecureHeaders(h)
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

		_, err = bouncer.dataStore.User().User(tokenData.ID)
		if err != nil && bouncer.dataStore.IsErrObjectNotFound(err) {
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

// mwAuthenticateFirst authenticates a request an auth token.
// A result of a first succeded token lookup would be used for the authentication.
func (bouncer *RequestBouncer) mwAuthenticateFirst(tokenLookups []tokenLookup, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var token *portainer.TokenData

		for _, lookup := range tokenLookups {
			token = lookup(r)

			if token != nil {
				break
			}
		}

		if token == nil {
			httperror.WriteError(w, http.StatusUnauthorized, "A valid authorisation token is missing", httperrors.ErrUnauthorized)
			return
		}

		_, err := bouncer.dataStore.User().User(token.ID)
		if err != nil && bouncer.dataStore.IsErrObjectNotFound(err) {
			httperror.WriteError(w, http.StatusUnauthorized, "Unauthorized", httperrors.ErrUnauthorized)
			return
		} else if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable to retrieve user details from the database", err)
			return
		}

		ctx := StoreTokenData(r, token)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// JWTAuthLookup looks up a valid bearer in the request.
func (bouncer *RequestBouncer) JWTAuthLookup(r *http.Request) *portainer.TokenData {
	// get token from the Authorization header or query parameter
	token, err := extractBearerToken(r)
	if err != nil {
		return nil
	}

	tokenData, err := bouncer.jwtService.ParseAndVerifyToken(token)
	if err != nil {
		return nil
	}

	return tokenData
}

// apiKeyLookup looks up an verifies an api-key by:
// - computing the digest of the raw api-key
// - verifying it exists in cache/database
// - matching the key to a user (ID, Role)
// If the key is valid/verified, the last updated time of the key is updated.
// Successful verification of the key will return a TokenData object - since the downstream handlers
// utilise the token injected in the request context.
func (bouncer *RequestBouncer) apiKeyLookup(r *http.Request) *portainer.TokenData {
	rawAPIKey, ok := extractAPIKey(r)
	if !ok {
		return nil
	}

	digest := bouncer.apiKeyService.HashRaw(rawAPIKey)

	user, apiKey, err := bouncer.apiKeyService.GetDigestUserAndKey(digest)
	if err != nil {
		return nil
	}

	tokenData := &portainer.TokenData{
		ID:       user.ID,
		Username: user.Username,
		Role:     user.Role,
	}
	if _, err := bouncer.jwtService.GenerateToken(tokenData); err != nil {
		return nil
	}

	// update the last used time of the key
	apiKey.LastUsed = time.Now().UTC().Unix()
	bouncer.apiKeyService.UpdateAPIKey(&apiKey)

	return tokenData
}

// extractBearerToken extracts the Bearer token from the request header or query parameter and returns the token.
func extractBearerToken(r *http.Request) (string, error) {
	// Optionally, token might be set via the "token" query parameter.
	// For example, in websocket requests
	token := r.URL.Query().Get("token")

	tokens, ok := r.Header["Authorization"]
	if ok && len(tokens) >= 1 {
		token = tokens[0]
		token = strings.TrimPrefix(token, "Bearer ")
	}
	if token == "" {
		return "", httperrors.ErrUnauthorized
	}
	return token, nil
}

// extractAPIKey extracts the api key from the api key request header or query params.
func extractAPIKey(r *http.Request) (apikey string, ok bool) {
	// extract the API key from the request header
	apikey = r.Header.Get(apiKeyHeader)
	if apikey != "" {
		return apikey, true
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

// mwSecureHeaders provides secure headers middleware for handlers.
func mwSecureHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("X-XSS-Protection", "1; mode=block")
		w.Header().Add("X-Content-Type-Options", "nosniff")
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

// EdgeComputeOperation defines a restriced edge compute operation.
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
