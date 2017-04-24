package middleware

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/context"
	httperror "github.com/portainer/portainer/http/error"

	"net/http"
	"strings"
)

type (
	// Service represents a service to manage HTTP middlewares
	Service struct {
		jwtService   portainer.JWTService
		authDisabled bool
	}
)

// NewService initializes a new middleware Service
func NewService(jwtService portainer.JWTService, authDisabled bool) *Service {
	return &Service{
		jwtService:   jwtService,
		authDisabled: authDisabled,
	}
}

// Public defines a chain of middleware for public endpoints (no authentication required)
func (service *Service) Public(h http.Handler) http.Handler {
	h = mwSecureHeaders(h)
	return h
}

// Authenticated defines a chain of middleware for private endpoints (authentication required)
func (service *Service) Authenticated(h http.Handler) http.Handler {
	h = service.mwCheckAuthentication(h)
	h = mwSecureHeaders(h)
	return h
}

// Administrator defines a chain of middleware for private administrator restricted endpoints
// (authentication and role admin required)
func (service *Service) Administrator(h http.Handler) http.Handler {
	h = mwCheckAdministratorRole(h)
	h = service.mwCheckAuthentication(h)
	h = mwSecureHeaders(h)
	return h
}

// mwSecureHeaders provides secure headers middleware for handlers
func mwSecureHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("X-Content-Type-Options", "nosniff")
		w.Header().Add("X-Frame-Options", "DENY")
		next.ServeHTTP(w, r)
	})
}

// mwCheckAdministratorRole check the role of the user associated to the request
func mwCheckAdministratorRole(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenData, err := context.GetTokenData(r)
		if err != nil {
			httperror.WriteErrorResponse(w, portainer.ErrResourceAccessDenied, http.StatusForbidden, nil)
			return
		}

		if tokenData.Role != portainer.AdministratorRole {
			httperror.WriteErrorResponse(w, portainer.ErrResourceAccessDenied, http.StatusForbidden, nil)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// mwCheckAuthentication provides Authentication middleware for handlers
func (service *Service) mwCheckAuthentication(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var tokenData *portainer.TokenData
		if !service.authDisabled {
			var token string

			// Get token from the Authorization header
			tokens, ok := r.Header["Authorization"]
			if ok && len(tokens) >= 1 {
				token = tokens[0]
				token = strings.TrimPrefix(token, "Bearer ")
			}

			if token == "" {
				httperror.WriteErrorResponse(w, portainer.ErrUnauthorized, http.StatusUnauthorized, nil)
				return
			}

			var err error
			tokenData, err = service.jwtService.ParseAndVerifyToken(token)
			if err != nil {
				httperror.WriteErrorResponse(w, err, http.StatusUnauthorized, nil)
				return
			}
		} else {
			tokenData = &portainer.TokenData{
				Role: portainer.AdministratorRole,
			}
		}

		// ctx := context.WithValue(r.Context(), contextAuthenticationKey, tokenData)
		ctx := context.StoreTokenData(r, tokenData)
		next.ServeHTTP(w, r.WithContext(ctx))
		return
	})
}
