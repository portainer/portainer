package http

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/portainer/portainer"
)

// ProxyFactory is a factory to create reverse proxies to Docker endpoints
type ProxyFactory struct {
	ResourceControlService portainer.ResourceControlService
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

// NewSingleHostReverseProxyWithHostHeader is based on NewSingleHostReverseProxy
// from golang.org/src/net/http/httputil/reverseproxy.go and merely sets the Host
// HTTP header, which NewSingleHostReverseProxy deliberately preserves.
// It also adds an extra Transport to the proxy to allow Portainer to rewrite the responses.
func (factory *ProxyFactory) NewSingleHostReverseProxyWithHostHeader(target *url.URL) *httputil.ReverseProxy {
	targetQuery := target.RawQuery
	director := func(req *http.Request) {
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
	}
	transport := &proxyTransport{
		ResourceControlService: factory.ResourceControlService,
	}
	return &httputil.ReverseProxy{Director: director, Transport: transport}
}
