package oauthtest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"

	"github.com/gorilla/mux"
	portainer "github.com/portainer/portainer/api"
)

const (
	AccessToken = "test-token"
)

// OAuthRoutes is an OAuth 2.0 compliant handler
func OAuthRoutes(code string, config *portainer.OAuthSettings) http.Handler {
	router := mux.NewRouter()

	router.HandleFunc(
		"/authorize",
		func(w http.ResponseWriter, req *http.Request) {
			location := fmt.Sprintf("%s?code=%s&state=%s", config.RedirectURI, code, "anything")
			// w.Header().Set("Location", location)
			// w.WriteHeader(http.StatusFound)
			http.Redirect(w, req, location, http.StatusFound)
		},
	).Methods(http.MethodGet)

	router.HandleFunc(
		"/access_token",
		func(w http.ResponseWriter, req *http.Request) {
			w.Header().Set("Content-Type", "application/json")

			if err := req.ParseForm(); err != nil {
				fmt.Fprintf(w, "ParseForm() err: %v", err)
				return
			}

			reqCode := req.FormValue("code")
			if reqCode != code {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"token_type":   "Bearer",
				"expires_in":   86400,
				"access_token": AccessToken,
				"scope":        "groups",
			})
		},
	).Methods(http.MethodPost)

	router.HandleFunc(
		"/user",
		func(w http.ResponseWriter, req *http.Request) {
			w.Header().Set("Content-Type", "application/json")

			authHeader := req.Header.Get("Authorization")
			splitToken := strings.Split(authHeader, "Bearer ")
			if len(splitToken) < 2 || splitToken[1] != AccessToken {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"username": "test-oauth-user",
				"groups":   "testing",
			})
		},
	).Methods(http.MethodGet)

	return router
}

// RunOAuthServer is a barebones OAuth 2.0 compliant test server which can be used to test OAuth 2 functionality
func RunOAuthServer(code string, config *portainer.OAuthSettings) (*httptest.Server, *portainer.OAuthSettings) {
	srv := httptest.NewUnstartedServer(http.DefaultServeMux)

	addr := srv.Listener.Addr()

	config.AuthorizationURI = fmt.Sprintf("http://%s/authorize", addr)
	config.AccessTokenURI = fmt.Sprintf("http://%s/access_token", addr)
	config.ResourceURI = fmt.Sprintf("http://%s/user", addr)
	config.RedirectURI = fmt.Sprintf("http://%s/", addr)

	srv.Config.Handler = OAuthRoutes(code, config)
	srv.Start()

	return srv, config
}
