package proxy

import (
	"io"
	"log"
	"net/http"

	"github.com/portainer/portainer/api/http/proxy/provider/docker"

	httperror "github.com/portainer/libhttp/error"
)

type localProxy struct {
	transport *docker.Transport
}

func (proxy *localProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Force URL/domain to http/unixsocket to be able to
	// use http.transport RoundTrip to do the requests via the socket
	r.URL.Scheme = "http"
	r.URL.Host = "unixsocket"

	res, err := proxy.transport.ProxyDockerRequest(r)
	if err != nil {
		code := http.StatusInternalServerError
		if res != nil && res.StatusCode != 0 {
			code = res.StatusCode
		}
		httperror.WriteError(w, code, "Unable to proxy the request via the Docker socket", err)
		return
	}
	defer res.Body.Close()

	for k, vv := range res.Header {
		for _, v := range vv {
			w.Header().Add(k, v)
		}
	}

	w.WriteHeader(res.StatusCode)

	if _, err := io.Copy(w, res.Body); err != nil {
		log.Printf("proxy error: %s\n", err)
	}
}
