package security

import (
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"

	"net/http"
	"strings"
)

type (
	// RequestBouncer represents an entity that manages API request accesses
	RequestBouncer struct {
		jwtService            portainer.JWTService
		userService           portainer.UserService
		teamMembershipService portainer.TeamMembershipService
		endpointGroupService  portainer.EndpointGroupService
		authDisabled          bool
	}

	// RequestBouncerParams represents the required parameters to create a new RequestBouncer instance.
	RequestBouncerParams struct {
		JWTService            portainer.JWTService
		UserService           portainer.UserService
		TeamMembershipService portainer.TeamMembershipService
		EndpointGroupService  portainer.EndpointGroupService
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
		endpointGroupService:  parameters.EndpointGroupService,
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

// RestrictedAccess defines a security check for restricted endpoints.
// Authentication is required to access these endpoints.
// The request context will be enhanced with a RestrictedRequestContext object
// that might be used later to authorize/filter access to resources.
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

// EndpointAccess retrieves the JWT token from the request context and verifies
// that the user can access the specified endpoint.
// An error is returned when access is denied.
func (bouncer *RequestBouncer) EndpointAccess(r *http.Request, endpoint *portainer.Endpoint) error {
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

	return nil
}

// mwSecureHeaders provides secure headers middleware for handlers.
func mwSecureHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("X-Frame-Options", "DENY")
		w.Header().Add("X-XSS-Protection", "1; mode=block")
		w.Header().Add("X-Content-Type-Options", "nosniff")
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
