package factory

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libstack/swarm"
)

// Note that we discard any non-canonical headers by design
var allowedHeaders = map[string]struct{}{
	"Accept":          {},
	"Accept-Encoding": {},
	"Accept-Language": {},
	"Cache-Control":   {},
	"Connection":      {},
	"Content-Length":  {},
	"Content-Type":    {},
	"Private-Token":   {},
	"Upgrade":         {},
	"User-Agent":      {},

	"X-Portaineragent-Target":                             {},
	http.CanonicalHeaderKey(swarm.ManagerOperationHeader): {},
	"X-Portainer-Volumename":                              {},
	"X-Registry-Auth":                                     {},
	"X-Registry-Config":                                   {},
	"X-Stream-Protocol-Version":                           {},

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
	proxy := &httputil.ReverseProxy{Rewrite: createRewriteFn(target)}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		httperror.WriteError(w, http.StatusBadGateway, "Proxy failure", err)
	}

	return proxy
}

func createRewriteFn(target *url.URL) func(*httputil.ProxyRequest) {
	targetQuery := target.RawQuery
	return func(proxyReq *httputil.ProxyRequest) {
		proxyReq.Out.URL.Scheme = target.Scheme
		proxyReq.Out.URL.Host = target.Host
		proxyReq.Out.URL.Path = singleJoiningSlash(target.Path, proxyReq.In.URL.Path)
		proxyReq.Out.URL.RawPath = ""
		proxyReq.Out.Host = proxyReq.Out.URL.Host
		if targetQuery == "" || proxyReq.Out.URL.RawQuery == "" {
			proxyReq.Out.URL.RawQuery = targetQuery + proxyReq.Out.URL.RawQuery
		} else {
			proxyReq.Out.URL.RawQuery = targetQuery + "&" + proxyReq.Out.URL.RawQuery
		}
		if _, ok := proxyReq.Out.Header["User-Agent"]; !ok {
			// explicitly disable User-Agent so it's not set to default value
			proxyReq.Out.Header.Set("User-Agent", "")
		}

		for k := range proxyReq.Out.Header {
			if _, ok := allowedHeaders[k]; !ok {
				// We use delete here instead of req.Header.Del because we want to delete non canonical headers.
				delete(proxyReq.Out.Header, k)
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
