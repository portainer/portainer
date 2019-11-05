package security

import (
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"

	"net/http"
	"strings"
)

type (
	// RequestBouncer represents an entity that manages API request accesses
	RequestBouncer struct {
		jwtService            portainer.JWTService
		userService           portainer.UserService
		teamMembershipService portainer.TeamMembershipService
		endpointService       portainer.EndpointService
		endpointGroupService  portainer.EndpointGroupService
		extensionService      portainer.ExtensionService
		rbacExtensionClient   *rbacExtensionClient
		authDisabled          bool
	}

	// RequestBouncerParams represents the required parameters to create a new RequestBouncer instance.
	RequestBouncerParams struct {
		JWTService            portainer.JWTService
		UserService           portainer.UserService
		TeamMembershipService portainer.TeamMembershipService
		EndpointService       portainer.EndpointService
		EndpointGroupService  portainer.EndpointGroupService
		ExtensionService      portainer.ExtensionService
		RBACExtensionURL      string
		AuthDisabled          bool
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
func NewRequestBouncer(parameters *RequestBouncerParams) *RequestBouncer {
	return &RequestBouncer{
		jwtService:            parameters.JWTService,
		userService:           parameters.UserService,
		teamMembershipService: parameters.TeamMembershipService,
		endpointService:       parameters.EndpointService,
		endpointGroupService:  parameters.EndpointGroupService,
		extensionService:      parameters.ExtensionService,
		rbacExtensionClient:   newRBACExtensionClient(parameters.RBACExtensionURL),
		authDisabled:          parameters.AuthDisabled,
	}
}

// PublicAccess defines a security check for public API endpoints.
// No authentication is required to access these endpoints.
func (bouncer *RequestBouncer) PublicAccess(h http.Handler) http.Handler {
	h = mwSecureHeaders(h)
	return h
}

// AdminAccess defines a security check for API endpoints that require an authorization check.
// Authentication is required to access these endpoints.
// If the RBAC extension is enabled, authorizations are required to use these endpoints.
// If the RBAC extension is not enabled, the administrator role is required to use these endpoints.
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
// If the RBAC extension is enabled, authorizations are required to use these endpoints.
// If the RBAC extension is not enabled, access is granted to any authenticated user.
// The request context will be enhanced with a RestrictedRequestContext object
// that might be used later to inside the API operation for extra authorization validation
// and resource filtering.
func (bouncer *RequestBouncer) RestrictedAccess(h http.Handler) http.Handler {
	h = bouncer.mwUpgradeToRestrictedRequest(h)
	h = bouncer.mwCheckPortainerAuthorizations(h, false)
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
// that the user can access the specified endpoint.
// If the RBAC extension is enabled and the authorizationCheck flag is set,
// it will also validate that the user can execute the specified operation.
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

	memberships, err := bouncer.teamMembershipService.TeamMembershipsByUserID(tokenData.ID)
	if err != nil {
		return err
	}

	group, err := bouncer.endpointGroupService.EndpointGroup(endpoint.GroupID)
	if err != nil {
		return err
	}

	if !authorizedEndpointAccess(endpoint, group, tokenData.ID, memberships) {
		return portainer.ErrEndpointAccessDenied
	}

	if authorizationCheck {
		err = bouncer.checkEndpointOperationAuthorization(r, endpoint)
		if err != nil {
			return portainer.ErrAuthorizationRequired
		}
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

	extension, err := bouncer.extensionService.Extension(portainer.RBACExtension)
	if err == portainer.ErrObjectNotFound {
		return nil
	} else if err != nil {
		return err
	}

	user, err := bouncer.userService.User(tokenData.ID)
	if err != nil {
		return err
	}

	apiOperation := &portainer.APIOperationAuthorizationRequest{
		Path:           r.URL.String(),
		Method:         r.Method,
		Authorizations: user.EndpointAuthorizations[endpoint.ID],
	}

	bouncer.rbacExtensionClient.setLicenseKey(extension.License.LicenseKey)
	return bouncer.rbacExtensionClient.checkAuthorization(apiOperation)
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

	memberships, err := bouncer.teamMembershipService.TeamMembershipsByUserID(tokenData.ID)
	if err != nil {
		return err
	}

	if !AuthorizedRegistryAccess(registry, tokenData.ID, memberships) {
		return portainer.ErrEndpointAccessDenied
	}

	return nil
}

func (bouncer *RequestBouncer) mwAuthenticatedUser(h http.Handler) http.Handler {
	h = bouncer.mwCheckAuthentication(h)
	h = mwSecureHeaders(h)
	return h
}

// mwCheckPortainerAuthorizations will verify that the user has the required authorization to access
// a specific API endpoint. It will leverage the RBAC extension authorization validation if the extension
// is enabled.
// If the administratorOnly flag is specified and the RBAC extension is not enabled, this will prevent non-admin
// users from accessing the endpoint.
func (bouncer *RequestBouncer) mwCheckPortainerAuthorizations(next http.Handler, administratorOnly bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenData, err := RetrieveTokenData(r)
		if err != nil {
			httperror.WriteError(w, http.StatusForbidden, "Access denied", portainer.ErrUnauthorized)
			return
		}

		if tokenData.Role == portainer.AdministratorRole {
			next.ServeHTTP(w, r)
			return
		}

		extension, err := bouncer.extensionService.Extension(portainer.RBACExtension)
		if err == portainer.ErrObjectNotFound {
			if administratorOnly {
				httperror.WriteError(w, http.StatusForbidden, "Access denied", portainer.ErrUnauthorized)
				return
			}

			next.ServeHTTP(w, r)
			return
		} else if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable to find a extension with the specified identifier inside the database", err)
			return
		}

		user, err := bouncer.userService.User(tokenData.ID)
		if err != nil && err == portainer.ErrObjectNotFound {
			httperror.WriteError(w, http.StatusUnauthorized, "Unauthorized", portainer.ErrUnauthorized)
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

		bouncer.rbacExtensionClient.setLicenseKey(extension.License.LicenseKey)
		err = bouncer.rbacExtensionClient.checkAuthorization(apiOperation)
		if err != nil {
			httperror.WriteError(w, http.StatusForbidden, "Access denied", portainer.ErrAuthorizationRequired)
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
			httperror.WriteError(w, http.StatusForbidden, "Access denied", portainer.ErrResourceAccessDenied)
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
func (bouncer *RequestBouncer) mwCheckAuthentication(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var tokenData *portainer.TokenData
		if !bouncer.authDisabled {
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
				httperror.WriteError(w, http.StatusUnauthorized, "Unauthorized", portainer.ErrUnauthorized)
				return
			}

			var err error
			tokenData, err = bouncer.jwtService.ParseAndVerifyToken(token)
			if err != nil {
				httperror.WriteError(w, http.StatusUnauthorized, "Invalid JWT token", err)
				return
			}

			_, err = bouncer.userService.User(tokenData.ID)
			if err != nil && err == portainer.ErrObjectNotFound {
				httperror.WriteError(w, http.StatusUnauthorized, "Unauthorized", portainer.ErrUnauthorized)
				return
			} else if err != nil {
				httperror.WriteError(w, http.StatusInternalServerError, "Unable to retrieve user details from the database", err)
				return
			}
		} else {
			tokenData = &portainer.TokenData{
				Role: portainer.AdministratorRole,
			}
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
		memberships, err := bouncer.teamMembershipService.TeamMembershipsByUserID(userID)
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
