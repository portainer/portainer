package main

import (
	"fmt"
	"github.com/dgrijalva/jwt-go"
	"net/http"
	"strings"
)

func addMiddleware(h http.Handler, middleware ...func(http.Handler) http.Handler) http.Handler {
	for _, mw := range middleware {
		h = mw(h)
	}
	return h
}

// authenticate provides Authentication middleware for handlers
func (api *api) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var token string

		// Get token from the Authorization header
		// format: Authorization: Bearer
		tokens, ok := r.Header["Authorization"]
		if ok && len(tokens) >= 1 {
			token = tokens[0]
			token = strings.TrimPrefix(token, "Bearer ")
		}

		if token == "" {
			http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
			return
		}

		parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				msg := fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
				return nil, msg
			}
			return api.secret, nil
		})
		if err != nil {
			http.Error(w, "Invalid JWT token", http.StatusUnauthorized)
			return
		}

		if parsedToken == nil || !parsedToken.Valid {
			http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
			return
		}

		// context.Set(r, "user", parsedToken)
		next.ServeHTTP(w, r)
		return
	})
}

// SecureHeaders adds secure headers to the API
func secureHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("X-Content-Type-Options", "nosniff")
		w.Header().Add("X-Frame-Options", "DENY")
		next.ServeHTTP(w, r)
	})
}
