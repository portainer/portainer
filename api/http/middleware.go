package http

import (
	"context"

	"github.com/portainer/portainer"

	"net/http"
	"strings"
)

type (
	// middleWareService represents a service to manage HTTP middlewares
	middleWareService struct {
		jwtService   portainer.JWTService
		authDisabled bool
	}
	contextKey int
)

const (
	contextAuthenticationKey contextKey = iota
)

func extractTokenDataFromRequestContext(request *http.Request) (*portainer.TokenData, error) {
	contextData := request.Context().Value(contextAuthenticationKey)
	if contextData == nil {
		return nil, portainer.ErrMissingContextData
	}

	tokenData := contextData.(*portainer.TokenData)
	return tokenData, nil
}

// public defines a chain of middleware for public endpoints (no authentication required)
func (service *middleWareService) public(h http.Handler) http.Handler {
	h = mwSecureHeaders(h)
	return h
}

// authenticated defines a chain of middleware for private endpoints (authentication required)
func (service *middleWareService) authenticated(h http.Handler) http.Handler {
	h = service.mwCheckAuthentication(h)
	h = mwSecureHeaders(h)
	return h
}

// administrator defines a chain of middleware for private administrator restricted endpoints
// (authentication and role admin required)
func (service *middleWareService) administrator(h http.Handler) http.Handler {
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
		tokenData, err := extractTokenDataFromRequestContext(r)
		if err != nil {
			Error(w, portainer.ErrResourceAccessDenied, http.StatusForbidden, nil)
			return
		}

		if tokenData.Role != portainer.AdministratorRole {
			Error(w, portainer.ErrResourceAccessDenied, http.StatusForbidden, nil)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// mwCheckAuthentication provides Authentication middleware for handlers
func (service *middleWareService) mwCheckAuthentication(next http.Handler) http.Handler {
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
				Error(w, portainer.ErrUnauthorized, http.StatusUnauthorized, nil)
				return
			}

			var err error
			tokenData, err = service.jwtService.ParseAndVerifyToken(token)
			if err != nil {
				Error(w, err, http.StatusUnauthorized, nil)
				return
			}
		} else {
			tokenData = &portainer.TokenData{
				Role: portainer.AdministratorRole,
			}
		}

		ctx := context.WithValue(r.Context(), contextAuthenticationKey, tokenData)
		next.ServeHTTP(w, r.WithContext(ctx))
		return
	})
}
