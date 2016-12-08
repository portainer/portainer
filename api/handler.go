package main

import (
	"github.com/gorilla/mux"
	"golang.org/x/net/websocket"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
)

// newHandler creates a new http.Handler with CSRF protection
func (a *api) newHandler(settings *Settings) http.Handler {
	var (
		mux         = mux.NewRouter()
		fileHandler = http.FileServer(http.Dir(a.assetPath))
	)
	handler := a.newAPIHandler()

	mux.Handle("/ws/exec", websocket.Handler(a.execContainer))
	mux.HandleFunc("/auth", a.authHandler)
	mux.Handle("/users", addMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		a.usersHandler(w, r)
	}), a.authenticate, secureHeaders))
	mux.Handle("/users/{username}", addMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		a.userHandler(w, r)
	}), a.authenticate, secureHeaders))
	mux.Handle("/users/{username}/passwd", addMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		a.userPasswordHandler(w, r)
	}), a.authenticate, secureHeaders))
	mux.HandleFunc("/users/admin/check", a.checkAdminHandler)
	mux.HandleFunc("/users/admin/init", a.initAdminHandler)
	mux.HandleFunc("/settings", func(w http.ResponseWriter, r *http.Request) {
		settingsHandler(w, r, settings)
	})
	mux.HandleFunc("/templates", func(w http.ResponseWriter, r *http.Request) {
		templatesHandler(w, r, a.templatesURL)
	})
	// mux.PathPrefix("/dockerapi/").Handler(http.StripPrefix("/dockerapi", handler))
	mux.PathPrefix("/dockerapi/").Handler(http.StripPrefix("/dockerapi", addMiddleware(handler, a.authenticate, secureHeaders)))

	mux.PathPrefix("/").Handler(http.StripPrefix("/", fileHandler))

	// CSRF protection is disabled for the moment
	// CSRFHandler := newCSRFHandler(a.dataPath)
	// return CSRFHandler(newCSRFWrapper(mux))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mux.ServeHTTP(w, r)
	})
}

// newAPIHandler initializes a new http.Handler based on the URL scheme
func (a *api) newAPIHandler() http.Handler {
	var handler http.Handler
	var endpoint = *a.endpoint
	if endpoint.Scheme == "tcp" {
		if a.tlsConfig != nil {
			handler = a.newTCPHandlerWithTLS(&endpoint)
		} else {
			handler = a.newTCPHandler(&endpoint)
		}
	} else if endpoint.Scheme == "unix" {
		socketPath := endpoint.Path
		if _, err := os.Stat(socketPath); err != nil {
			if os.IsNotExist(err) {
				log.Fatalf("Unix socket %s does not exist", socketPath)
			}
			log.Fatal(err)
		}
		handler = a.newUnixHandler(socketPath)
	} else {
		log.Fatalf("Bad Docker enpoint: %v. Only unix:// and tcp:// are supported.", &endpoint)
	}
	return handler
}

// newUnixHandler initializes a new UnixHandler
func (a *api) newUnixHandler(e string) http.Handler {
	return &unixHandler{e}
}

// newTCPHandler initializes a HTTP reverse proxy
func (a *api) newTCPHandler(u *url.URL) http.Handler {
	u.Scheme = "http"
	return httputil.NewSingleHostReverseProxy(u)
}

// newTCPHandlerWithL initializes a HTTPS reverse proxy with a TLS configuration
func (a *api) newTCPHandlerWithTLS(u *url.URL) http.Handler {
	u.Scheme = "https"
	proxy := httputil.NewSingleHostReverseProxy(u)
	proxy.Transport = &http.Transport{
		TLSClientConfig: a.tlsConfig,
	}
	return proxy
}
