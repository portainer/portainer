package security

import (
	"errors"
	"log"
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
		dataStore      portainer.DataStore
		jwtService     portainer.JWTService
		licenseService portainer.LicenseService
	}

	// RestrictedRequestContext is a data structure containing information
	// used in AuthenticatedAccess
	RestrictedRequestContext struct {
		IsAdmin         bool
		IsTeamLeader    bool
		UserID          portainer.UserID
		UserMemberships []portainer.TeamMembership
	}
)

// NewRequestBouncer initializes a new RequestBouncer
func NewRequestBouncer(dataStore portainer.DataStore, licenseService portainer.LicenseService, jwtService portainer.JWTService) *RequestBouncer {
	return &RequestBouncer{
		dataStore:      dataStore,
		jwtService:     jwtService,
		licenseService: licenseService,
	}
}

// PublicAccess defines a security check for public API endpoints.
// No authentication is required to access these endpoints.
func (bouncer *RequestBouncer) PublicAccess(h http.Handler) http.Handler {
	h = mwSecureHeaders(h)
	return h
}

// AdminAccess is an alias for RestrictedAddress
// It's not removed as it's used across our codebase and removing will cause conflicts with CE
func (bouncer *RequestBouncer) AdminAccess(h http.Handler) http.Handler {
	return bouncer.RestrictedAccess(h)
}

// RestrictedAccess defines a security check for restricted API endpoints.
// Authentication and authorizations are required to access these endpoints.
// The request context will be enhanced with a RestrictedRequestContext object
// that might be used later to inside the API operation for extra authorization validation
// and resource filtering.
//
// Bouncer operations are applied backwards:
//  - Parse the JWT from the request and stored in context, user has to be authenticated
//  - Authorize the user to the request from the token data
//  - Upgrade to the restricted request
func (bouncer *RequestBouncer) RestrictedAccess(h http.Handler) http.Handler {
	h = bouncer.mwUpgradeToRestrictedRequest(h)
	h = bouncer.mwCheckPortainerAuthorizations(h)
	h = bouncer.mwAuthenticatedUser(h)
	return h
}

// AuthenticatedAccess defines a security check for restricted API endpoints.
// Authentication is required to access these endpoints.
// The request context will be enhanced with a RestrictedRequestContext object
// that might be used later to inside the API operation for extra authorization validation
// and resource filtering.
//
// Bouncer operations are applied backwards:
//  - Parse the JWT from the request and stored in context, user has to be authenticated
//  - Upgrade to the restricted request
func (bouncer *RequestBouncer) AuthenticatedAccess(h http.Handler) http.Handler {
	h = bouncer.mwUpgradeToRestrictedRequest(h)
	h = bouncer.mwAuthenticatedUser(h)
	return h
}

// AuthorizedEndpointOperation retrieves the JWT token from the request context and verifies
// that the user can access the specified endpoint.
// If the authorizationCheck flag is set, it will also validate that the user can execute the specified operation.
// An error is returned when access to the endpoint is denied or if the user do not have the required
// authorization to execute the operation.
func (bouncer *RequestBouncer) AuthorizedEndpointOperation(r *http.Request, endpoint *portainer.Endpoint, authorizationCheck bool) error {
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

	if authorizationCheck {
		err = bouncer.checkEndpointOperationAuthorization(r, endpoint)
		if err != nil {
			return ErrAuthorizationRequired
		}
	}

	return nil
}

// AuthorizedEdgeEndpointOperation verifies that the request was received from a valid Edge endpoint
func (bouncer *RequestBouncer) AuthorizedEdgeEndpointOperation(r *http.Request, endpoint *portainer.Endpoint) error {
	if endpoint.Type != portainer.EdgeAgentOnKubernetesEnvironment && endpoint.Type != portainer.EdgeAgentOnDockerEnvironment {
		return errors.New("Invalid endpoint type")
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

func (bouncer *RequestBouncer) checkEndpointOperationAuthorization(r *http.Request, endpoint *portainer.Endpoint) error {
	tokenData, err := RetrieveTokenData(r)
	if err != nil {
		return err
	}

	if tokenData.Role == portainer.AdministratorRole {
		return nil
	}

	user, err := bouncer.dataStore.User().User(tokenData.ID)
	if err != nil {
		return err
	}

	apiOperation := &portainer.APIOperationAuthorizationRequest{
		Path:           r.URL.String(),
		Method:         r.Method,
		Authorizations: user.EndpointAuthorizations[endpoint.ID],
	}

	if !authorizedOperation(apiOperation) {
		return errors.New("Unauthorized")
	}

	return nil
}

// RegistryAccess retrieves the JWT token from the request context and verifies
// that the user can access the specified registry.
// An error is returned when access is denied.
func (bouncer *RequestBouncer) RegistryAccess(r *http.Request, registry *portainer.Registry) error {
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

	if !AuthorizedRegistryAccess(registry, tokenData.ID, memberships) {
		return httperrors.ErrEndpointAccessDenied
	}

	return nil
}

// First parse the JWT token and put it into the http context.
//
// Then add secure headers to the http reponse.
func (bouncer *RequestBouncer) mwAuthenticatedUser(h http.Handler) http.Handler {
	h = bouncer.mwCheckAuthentication(h)
	h = mwSecureHeaders(h)
	return h
}

// mwCheckLicense will verify that the instance license is valid
func (bouncer *RequestBouncer) mwCheckLicense(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		info, err := bouncer.licenseService.Info()
		if err != nil {
			log.Printf("[ERROR] [http,security,bouncer] [err: %s] [msg: Failed fetching license info]", err)
			httperror.WriteError(w, http.StatusForbidden, "Access denied", httperrors.ErrUnauthorized)
			return
		}

		if !info.Valid {
			log.Printf("[INFO] [http,security,bouncer] [msg: licenses are invalid]")
			httperror.WriteError(w, http.StatusForbidden, "Access denied", httperrors.ErrUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// mwCheckPortainerAuthorizations will verify that the user has the required authorization to access
// a specific API endpoint.
func (bouncer *RequestBouncer) mwCheckPortainerAuthorizations(next http.Handler) http.Handler {
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

		user, err := bouncer.dataStore.User().User(tokenData.ID)
		if err != nil && err == bolterrors.ErrObjectNotFound {
			httperror.WriteError(w, http.StatusUnauthorized, "Unauthorized", httperrors.ErrUnauthorized)
			return
		} else if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable to retrieve user details from the database", err)
			return
		}

		apiOperation := &portainer.APIOperationAuthorizationRequest{
			Path:           r.URL.String(),
			Method:         r.Method,
			Authorizations: user.PortainerAuthorizations,
		}

		if !authorizedOperation(apiOperation) {
			httperror.WriteError(w, http.StatusForbidden, "Access denied", ErrAuthorizationRequired)
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

		ctx := storeRestrictedRequestContext(r, requestContext)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// mwCheckAuthentication provides Authentication middleware for handlers
//
// It parses the JWT token and add the parsed token data into the http context
func (bouncer *RequestBouncer) mwCheckAuthentication(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var tokenData *portainer.TokenData
		var token string

		// Optionally, token might be set via the "token" query parameter.
		// For example, in websocket requests
		token = r.URL.Query().Get("token")

		// Get token from the Authorization header
		tokens, ok := r.Header["Authorization"]
		if ok && len(tokens) >= 1 {
			token = tokens[0]
			token = strings.TrimPrefix(token, "Bearer ")
		}

		if token == "" {
			httperror.WriteError(w, http.StatusUnauthorized, "Unauthorized", httperrors.ErrUnauthorized)
			return
		}

		var err error
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

		ctx := storeTokenData(r, tokenData)
		next.ServeHTTP(w, r.WithContext(ctx))
		return
	})
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
	requestContext := &RestrictedRequestContext{
		IsAdmin: true,
		UserID:  userID,
	}

	if userRole != portainer.AdministratorRole {
		requestContext.IsAdmin = false
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

		requestContext.IsTeamLeader = isTeamLeader
		requestContext.UserMemberships = memberships
	}

	return requestContext, nil
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
