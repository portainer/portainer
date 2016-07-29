package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
)

// newHandler creates a new http.Handler with CSRF protection
func newHandler(dir string, d string, e string, c Config, tlsFlags TLSFlags) http.Handler {
	var (
		mux         = http.NewServeMux()
		fileHandler = http.FileServer(http.Dir(dir))
	)

	u, perr := url.Parse(e)
	if perr != nil {
		log.Fatal(perr)
	}

	handler := newAPIHandler(u, tlsFlags)
	CSRFHandler := newCSRFHandler(d, authKeyFile)

	mux.Handle("/dockerapi/", http.StripPrefix("/dockerapi", handler))
	mux.Handle("/", fileHandler)
	mux.HandleFunc("/config", func(w http.ResponseWriter, r *http.Request) {
		configurationHandler(w, r, c)
	})
	return CSRFHandler(newCSRFWrapper(mux))
}

// newAPIHandler initializes a new http.Handler based on the URL scheme
func newAPIHandler(u *url.URL, tlsFlags TLSFlags) http.Handler {
	var handler http.Handler
	if u.Scheme == "tcp" {
		if tlsFlags.tls {
			handler = newTCPHandlerWithTLS(u, tlsFlags)
		} else {
			handler = newTCPHandler(u)
		}
	} else if u.Scheme == "unix" {
		socketPath := u.Path
		if _, err := os.Stat(socketPath); err != nil {
			if os.IsNotExist(err) {
				log.Fatalf("Unix socket %s does not exist", socketPath)
			}
			log.Fatal(err)
		}
		handler = newUnixHandler(socketPath)
	} else {
		log.Fatalf("Bad Docker enpoint: %s. Only unix:// and tcp:// are supported.", u)
	}
	return handler
}

// newUnixHandler initializes a new UnixHandler
func newUnixHandler(e string) http.Handler {
	return &unixHandler{e}
}

// newTCPHandler initializes a HTTP reverse proxy
func newTCPHandler(u *url.URL) http.Handler {
	u.Scheme = "http"
	return httputil.NewSingleHostReverseProxy(u)
}

// newTCPHandlerWithL initializes a HTTPS reverse proxy with a TLS configuration
func newTCPHandlerWithTLS(u *url.URL, tlsFlags TLSFlags) http.Handler {
	u.Scheme = "https"
	var tlsConfig = newTLSConfig(tlsFlags)
	proxy := httputil.NewSingleHostReverseProxy(u)
	proxy.Transport = &http.Transport{
		TLSClientConfig: tlsConfig,
	}
	return proxy
}
