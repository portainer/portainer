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
	// used in RestrictedAccess
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

// PublicAccess defines a security check for public endpoints.
// No authentication is required to access these endpoints.
func (bouncer *RequestBouncer) PublicAccess(h http.Handler) http.Handler {
	h = mwSecureHeaders(h)
	return h
}

// AuthenticatedAccess defines a security check for private endpoints.
// Authentication is required to access these endpoints.
func (bouncer *RequestBouncer) AuthenticatedAccess(h http.Handler) http.Handler {
	h = bouncer.mwCheckAuthentication(h)
	h = mwSecureHeaders(h)
	return h
}

// TODO: document
func (bouncer *RequestBouncer) AuthorizedAccess(h http.Handler) http.Handler {
	h = bouncer.mwCheckPortainerAuthorizations(h)
	h = bouncer.mwUpgradeToRestrictedRequest(h)
	h = bouncer.AuthenticatedAccess(h)
	return h
}

// RestrictedAccess defines a security check for restricted endpoints.
// Authentication is required to access these endpoints.
// The request context will be enhanced with a RestrictedRequestContext object
// that might be used later to authorize/filter access to resources inside an endpoint.
func (bouncer *RequestBouncer) RestrictedAccess(h http.Handler) http.Handler {
	h = bouncer.mwUpgradeToRestrictedRequest(h)
	h = bouncer.AuthenticatedAccess(h)
	return h
}

// AdministratorAccess defines a chain of middleware for restricted endpoints.
// Authentication as well as administrator role are required to access these endpoints.
func (bouncer *RequestBouncer) AdministratorAccess(h http.Handler) http.Handler {
	h = mwCheckAdministratorRole(h)
	h = bouncer.AuthenticatedAccess(h)
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
	extension, err := bouncer.extensionService.Extension(portainer.RBACExtension)
	if err == portainer.ErrObjectNotFound {
		return nil
	} else if err != nil {
		return err
	}

	tokenData, err := RetrieveTokenData(r)
	if err != nil {
		return err
	}

	if tokenData.Role == portainer.AdministratorRole {
		return nil
	}

	apiOperation := &portainer.APIOperationAuthorizationRequest{
		Path:           r.URL.String(),
		Method:         r.Method,
		Authorizations: tokenData.EndpointAuthorizations[endpoint.ID],
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

// mwSecureHeaders provides secure headers middleware for handlers.
func mwSecureHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("X-XSS-Protection", "1; mode=block")
		w.Header().Add("X-Content-Type-Options", "nosniff")
		next.ServeHTTP(w, r)
	})
}

func (bouncer *RequestBouncer) mwCheckPortainerAuthorizations(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenData, err := RetrieveTokenData(r)
		if err != nil {
			httperror.WriteError(w, http.StatusForbidden, "Access denied", portainer.ErrResourceAccessDenied)
			return
		}

		if tokenData.Role == portainer.AdministratorRole {
			next.ServeHTTP(w, r)
			return
		}

		extension, err := bouncer.extensionService.Extension(portainer.RBACExtension)
		if err == portainer.ErrObjectNotFound {
			next.ServeHTTP(w, r)
			return
		} else if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable to find a extension with the specified identifier inside the database", err)
			return
		}

		apiOperation := &portainer.APIOperationAuthorizationRequest{
			Path:           r.URL.String(),
			Method:         r.Method,
			Authorizations: tokenData.PortainerAuthorizations,
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

// mwCheckAdministratorRole check the role of the user associated to the request
func mwCheckAdministratorRole(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenData, err := RetrieveTokenData(r)
		if err != nil || tokenData.Role != portainer.AdministratorRole {
			httperror.WriteError(w, http.StatusForbidden, "Access denied", portainer.ErrResourceAccessDenied)
			return
		}

		next.ServeHTTP(w, r)
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
				httperror.WriteError(w, http.StatusInternalServerError, "Unable to retrieve users from the database", err)
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
