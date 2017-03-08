package http

import (
	"io"
	"net"
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
func (factory *ProxyFactory) newSingleHostReverseProxyWithHostHeader(target *url.URL) *httputil.ReverseProxy {
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

func (factory *ProxyFactory) newHTTPProxy(u *url.URL) http.Handler {
	u.Scheme = "http"
	return factory.newSingleHostReverseProxyWithHostHeader(u)
}

func (factory *ProxyFactory) newHTTPSProxy(u *url.URL, endpoint *portainer.Endpoint) (http.Handler, error) {
	u.Scheme = "https"
	proxy := factory.newSingleHostReverseProxyWithHostHeader(u)
	config, err := createTLSConfiguration(endpoint.TLSCACertPath, endpoint.TLSCertPath, endpoint.TLSKeyPath)
	if err != nil {
		return nil, err
	}
	proxy.Transport.(*http.Transport).TLSClientConfig = config
	// proxy.Transport = &http.Transport{
	// 	TLSClientConfig: config,
	// }
	return proxy, nil
}

func (factory *ProxyFactory) newSocketProxy(path string) http.Handler {
	return &unixSocketHandler{path, &proxyTransport{
		ResourceControlService: factory.ResourceControlService,
	}}
}

// unixSocketHandler represents a handler to proxy HTTP requests via a unix:// socket
type unixSocketHandler struct {
	path      string
	transport *proxyTransport
}

func (h *unixSocketHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := net.Dial("unix", h.path)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, nil)
		return
	}
	c := httputil.NewClientConn(conn, nil)
	defer c.Close()

	res, err := c.Do(r)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, nil)
		return
	}
	defer res.Body.Close()

	err = h.transport.proxyDockerRequests(r, res)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, nil)
		return
	}

	for k, vv := range res.Header {
		for _, v := range vv {
			w.Header().Add(k, v)
		}
	}
	if _, err := io.Copy(w, res.Body); err != nil {
		Error(w, err, http.StatusInternalServerError, nil)
	}
}
