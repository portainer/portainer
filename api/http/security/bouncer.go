package security

import (
	"bytes"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"

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

	// MiddlewareFunc is function signature which middlewares must satisfy
	MiddlewareFunc func(next http.Handler) http.Handler
)

// NewRequestBouncer initializes a new RequestBouncer
func NewRequestBouncer(dataStore portainer.DataStore, jwtService portainer.JWTService) *RequestBouncer {
	return &RequestBouncer{
		dataStore:  dataStore,
		jwtService: jwtService,
	}
}

// AnyAuth passes down the request to the underlying handler by running it through all the provided middlewares.
// If any of the provided middlewares are satisfied, the request will be processed by the underlying handler.
func (bouncer *RequestBouncer) AnyAuth(middlewares []MiddlewareFunc, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// if middlewares provided are nil or empty, serve request as is and return
		if len(middlewares) == 0 || middlewares == nil {
			next.ServeHTTP(w, r)
			return
		}

		wantResponse := []byte("ok")
		testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Write(wantResponse)
		})

		var workingMiddleware MiddlewareFunc
		wg := sync.WaitGroup{}
		wg.Add(len(middlewares))

		// process the request against test handler in parallel through all the provided middelwares
		// the last middleware that returns a successful response response will served the request to the actual handler
		for _, m := range middlewares {
			go func(middleware MiddlewareFunc) {
				rr := httptest.NewRecorder()
				h := middleware(testHandler)
				h.ServeHTTP(rr, r)
				if bytes.Equal(rr.Body.Bytes(), wantResponse) {
					workingMiddleware = middleware
				}
				wg.Done()
			}(m)
		}
		wg.Wait()

		// if none of the middlewares passed, utilise the first middleware in the chain to return the error
		if workingMiddleware == nil {
			middlewares[0](next).ServeHTTP(w, r)
			return
		}

		// note: the workingMiddleware is the last middleware in the chain (if multiple middlewares passed)
		workingMiddleware(next).ServeHTTP(w, r)
	})
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
	h = bouncer.mwCheckAuthentication(h)
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

// mwCheckAuthentication provides Authentication middleware for handlers
//
// It parses the JWT token and adds the parsed token data to the http context
func (bouncer *RequestBouncer) mwCheckAuthentication(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var tokenData *portainer.TokenData

		// get token from the Authorization header or query parameter
		token, err := ExtractBearerToken(r)
		if err != nil {
			httperror.WriteError(w, http.StatusUnauthorized, "Unauthorized", err)
			return
		}

		tokenData, err = bouncer.jwtService.ParseAndVerifyToken(token)
		if err != nil {
			httperror.WriteError(w, http.StatusUnauthorized, "Invalid JWT token", err)
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

		ctx := StoreTokenData(r, tokenData)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// ExtractBearerToken extracts the Bearer token from the request header or query parameter and returns the token.
func ExtractBearerToken(r *http.Request) (string, error) {
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
