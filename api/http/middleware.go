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

func addMiddleware(h http.Handler, middleware ...func(http.Handler) http.Handler) http.Handler {
	for _, mw := range middleware {
		h = mw(h)
	}
	return h
}

func (service *middleWareService) addMiddleWares(h http.Handler) http.Handler {
	h = service.middleWareSecureHeaders(h)
	h = service.middleWareAuthenticate(h)
	return h
}

// middleWareAuthenticate provides secure headers middleware for handlers
func (*middleWareService) middleWareSecureHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("X-Content-Type-Options", "nosniff")
		w.Header().Add("X-Frame-Options", "DENY")
		next.ServeHTTP(w, r)
	})
}

// middleWareAuthenticate provides Authentication middleware for handlers
func (service *middleWareService) middleWareAuthenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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

			tokenData, err := service.jwtService.ParseAndVerifyToken(token)
			if err != nil {
				Error(w, err, http.StatusUnauthorized, nil)
				return
			}
			ctx := context.WithValue(r.Context(), contextAuthenticationKey, tokenData)
			next.ServeHTTP(w, r.WithContext(ctx))
		} else {
			next.ServeHTTP(w, r)
		}

		return
	})
}
