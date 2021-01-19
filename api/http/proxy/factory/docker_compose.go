package factory

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/http/proxy/factory/dockercompose"
)

func (factory *ProxyFactory) NewDockerComposeProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	if strings.HasPrefix(endpoint.URL, "unix://") || strings.HasPrefix(endpoint.URL, "npipe://") {
		return factory.newDockerComposeLocalProxy(endpoint)
	}

	return factory.newDockerComposeAgentProxy(endpoint)
}

func (factory *ProxyFactory) newDockerComposeLocalProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	if endpoint.Type == portainer.EdgeAgentOnDockerEnvironment {
		tunnel := factory.reverseTunnelService.GetTunnelDetails(endpoint.ID)
		endpoint.URL = fmt.Sprintf("http://127.0.0.1:%d", tunnel.Port)
	}

	endpointURL, err := url.Parse(endpoint.URL)
	if err != nil {
		return nil, err
	}

	endpointURL.Scheme = "http"
	httpTransport := &http.Transport{}

	if endpoint.TLSConfig.TLS || endpoint.TLSConfig.TLSSkipVerify {
		config, err := crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig.TLSCACertPath, endpoint.TLSConfig.TLSCertPath, endpoint.TLSConfig.TLSKeyPath, endpoint.TLSConfig.TLSSkipVerify)
		if err != nil {
			return nil, err
		}

		httpTransport.TLSClientConfig = config
		endpointURL.Scheme = "https"
	}

	dockerComposeTransport := dockercompose.NewAgentTransport(factory.signatureService, httpTransport)

	proxy := newSingleHostReverseProxyWithHostHeader(endpointURL)
	proxy.Transport = dockerComposeTransport
	return proxy, nil
}

func (factory *ProxyFactory) newDockerComposeAgentProxy(endpoint *portainer.Endpoint) (http.Handler, error) {

	endpointURL, err := url.Parse(endpoint.URL)
	if err != nil {
		return nil, err
	}

	endpointURL.Scheme = "http"
	httpTransport := &http.Transport{}

	if endpoint.TLSConfig.TLS || endpoint.TLSConfig.TLSSkipVerify {
		config, err := crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig.TLSCACertPath, endpoint.TLSConfig.TLSCertPath, endpoint.TLSConfig.TLSKeyPath, endpoint.TLSConfig.TLSSkipVerify)
		if err != nil {
			return nil, err
		}

		httpTransport.TLSClientConfig = config
		endpointURL.Scheme = "https"
	}

	dockerComposeTransport := dockercompose.NewAgentTransport(factory.signatureService, httpTransport)

	proxy := newSingleHostReverseProxyWithHostHeader(endpointURL)
	proxy.Transport = dockerComposeTransport
	return proxy, nil
}

// // ServeHTTP is the http.Handler interface implementation
// // for a local (Unix socket or Windows named pipe) Docker proxy.
// func (proxy *dockerLocalProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
// 	// Force URL/domain to http/unixsocket to be able to
// 	// use http.transport RoundTrip to do the requests via the socket
// 	r.URL.Scheme = "http"
// 	r.URL.Host = "unixsocket"

// 	res, err := proxy.transport.ProxyDockerRequest(r)
// 	if err != nil {
// 		code := http.StatusInternalServerError
// 		if res != nil && res.StatusCode != 0 {
// 			code = res.StatusCode
// 		}

// 		httperror.WriteError(w, code, "Unable to proxy the request via the Docker socket", err)
// 		return
// 	}
// 	defer res.Body.Close()

// 	for k, vv := range res.Header {
// 		for _, v := range vv {
// 			w.Header().Add(k, v)
// 		}
// 	}

// 	w.WriteHeader(res.StatusCode)

// 	if _, err := io.Copy(w, res.Body); err != nil {
// 		log.Printf("proxy error: %s\n", err)
// 	}
// }
