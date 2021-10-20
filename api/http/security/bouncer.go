package security

import (
	"errors"
	"net/http"
	"strings"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	httperrors "github.com/portainer/portainer/api/http/errors"
)

type (
	// RequestBouncer represents an entity that manages API request accesses
	RequestBouncer struct {
		dataStore  portainer.DataStore
		jwtService portainer.JWTService
	}

	// RestrictedRequestContext is a data structure containing information
	// used in AuthenticatedAccess
	RestrictedRequestContext struct {
		IsAdmin         bool
		IsTeamLeader    bool
		UserID          portainer.UserID
		UserMemberships []portainer.TeamMembership
	}

	// authError is the error struct that captures data to populate the http.WriteError in the caller
	authError struct {
		statusCode int
		message    string
		err        error
	}

	// verificationFunc is the function signature for any auth based functions
	verificationFunc func(*http.Request) (*portainer.TokenData, *authError)
)

const apiKeyHeader = "X-API-KEY"

// NewRequestBouncer initializes a new RequestBouncer
func NewRequestBouncer(dataStore portainer.DataStore, jwtService portainer.JWTService) *RequestBouncer {
	return &RequestBouncer{
		dataStore:  dataStore,
		jwtService: jwtService,
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

	return nil
}

// handlers are applied backwards to the incoming request:
// - add secure handlers to the response
// - parse the JWT token and put it into the http context.
func (bouncer *RequestBouncer) mwAuthenticatedUser(h http.Handler) http.Handler {
	// Use mwAnyAuth middleware to support multiple auth paradigms
	// currently supported auth: JWT Auth, API-Key Auth
	h = bouncer.mwAnyAuth([]verificationFunc{
		bouncer.processJWTAuth,
		bouncer.processAPIKeyAuth,
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
		if err != nil && err == bolterrors.ErrObjectNotFound {
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

// mwAnyAuth provides middleware for to support multiple auth paradigms.
// If any of the verificationFunc's in the list passes, the last passing function will be used to process the request.
func (bouncer *RequestBouncer) mwAnyAuth(tokenFetchers []verificationFunc, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenData := &portainer.TokenData{}
		finalAuthError := &authError{http.StatusUnauthorized, "Unauthorized", httperrors.ErrUnauthorized}

		for _, tokenFetcher := range tokenFetchers {
			token, authErr := tokenFetcher(r)
			if authErr != nil {
				finalAuthError = authErr
			}
			if token != nil {
				tokenData = token
			}
		}

		if (tokenData == &portainer.TokenData{}) {
			httperror.WriteError(w, finalAuthError.statusCode, finalAuthError.message, finalAuthError.err)
			return
		}

		user, _ := bouncer.dataStore.User().User(tokenData.ID)
		if user == nil {
			httperror.WriteError(w, http.StatusUnauthorized, "Unauthorized", httperrors.ErrUnauthorized)
			return
		}

		ctx := StoreTokenData(r, tokenData)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// processJWTAuth provides JWT authentication checks for the request.
// processJWTAuth parses the JWT token from request `Authorization` header and returns the token data
func (bouncer *RequestBouncer) processJWTAuth(r *http.Request) (*portainer.TokenData, *authError) {
	// get token from the Authorization header or query parameter
	token, err := extractBearerToken(r)
	if err != nil {
		return nil, &authError{http.StatusUnauthorized, "Unauthorized", err}
	}

	tokenData, err := bouncer.jwtService.ParseAndVerifyToken(token)
	if err != nil {
		return nil, &authError{http.StatusUnauthorized, "Invalid JWT token", err}
	}

	return tokenData, nil
}

// processAPIKeyAuth provides api-key authentication checks for the request.
// It parses the api-key from request `X-API-KEY` header and uses it to generate the
// respective user's portainer token data.
func (bouncer *RequestBouncer) processAPIKeyAuth(r *http.Request) (*portainer.TokenData, *authError) {
	// get api-key from the request header
	_, err := extractAPIKey(r)
	if err != nil {
		return nil, &authError{http.StatusUnauthorized, "Unauthorized", err}
	}

	// TODO: hash API-Key
	// TODO: compare API-Key with the one stored in the database
	// TODO: retrieve user associated to the API-Key
	// TODO: generate a new token for the user
	// TODO: return generated token

	var tokenData *portainer.TokenData

	return tokenData, nil
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

// extractAPIKey extracts the api key from the `X-API-KEY` request header (if present).
func extractAPIKey(r *http.Request) (string, error) {
	var apiKey string
	apiKeys, ok := r.Header[http.CanonicalHeaderKey(apiKeyHeader)]
	if ok {
		apiKey = apiKeys[0]
	}
	if apiKey == "" {
		return "", httperrors.ErrUnauthorized
	}
	return apiKey, nil
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
