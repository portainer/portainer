package factory

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

// Note that we discard any non-canonical headers by design
var allowedHeaders = map[string]struct{}{
	"Accept":                    {},
	"Accept-Encoding":           {},
	"Accept-Language":           {},
	"Cache-Control":             {},
	"Connection":                {},
	"Content-Length":            {},
	"Content-Type":              {},
	"Private-Token":             {},
	"Upgrade":                   {},
	"User-Agent":                {},
	"X-Portaineragent-Target":   {},
	"X-Portainer-Volumename":    {},
	"X-Registry-Auth":           {},
	"X-Stream-Protocol-Version": {},
	// WebSocket headers those are required for kubectl exec/attach/port-forward operations
	"Sec-Websocket-Key":        {},
	"Sec-Websocket-Version":    {},
	"Sec-Websocket-Protocol":   {},
	"Sec-Websocket-Extensions": {},
}

// newSingleHostReverseProxyWithHostHeader is based on NewSingleHostReverseProxy
// from golang.org/src/net/http/httputil/reverseproxy.go and merely sets the Host
// HTTP header, which NewSingleHostReverseProxy deliberately preserves.
func NewSingleHostReverseProxyWithHostHeader(target *url.URL) *httputil.ReverseProxy {
	return &httputil.ReverseProxy{Director: createDirector(target)}
}

func createDirector(target *url.URL) func(*http.Request) {
	targetQuery := target.RawQuery
	return func(req *http.Request) {
		req.URL.Scheme = target.Scheme
		req.URL.Host = target.Host
		req.URL.Path = singleJoiningSlash(target.Path, req.URL.Path)
		req.Host = req.URL.Host
		if targetQuery == "" || req.URL.RawQuery == "" {
			req.URL.RawQuery = targetQuery + req.URL.RawQuery
		} else {
			req.URL.RawQuery = targetQuery + "&" + req.URL.RawQuery
		}
		if _, ok := req.Header["User-Agent"]; !ok {
			// explicitly disable User-Agent so it's not set to default value
			req.Header.Set("User-Agent", "")
		}

		for k := range req.Header {
			if _, ok := allowedHeaders[k]; !ok {
				// We use delete here instead of req.Header.Del because we want to delete non canonical headers.
				delete(req.Header, k)
			}
		}
	}
}

// singleJoiningSlash from golang.org/src/net/http/httputil/reverseproxy.go
// included here for use in NewSingleHostReverseProxyWithHostHeader
// because its used in NewSingleHostReverseProxy from golang.org/src/net/http/httputil/reverseproxy.go
func singleJoiningSlash(a, b string) string {
	aslash := strings.HasSuffix(a, "/")
	bslash := strings.HasPrefix(b, "/")
	switch {
	case aslash && bslash:
		return a + b[1:]
	case !aslash && !bslash:
		return a + "/" + b
	}
	return a + b
}
