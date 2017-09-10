package proxy

// represents a handler to proxy HTTP requests via a unix:// socket and npope:// named pipes
import (
	"io"
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
)

type localProxy struct {
	Transport *proxyTransport
}

func (proxy *localProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Force URL/domain to http/unixsocket to be able to
	// use http.Transport RoundTrip to do the requests via the socket
	r.URL.Scheme = "http"
	r.URL.Host = "unixsocket"

	res, err := proxy.Transport.proxyDockerRequest(r)
	if err != nil {
		code := http.StatusInternalServerError
		if res != nil && res.StatusCode != 0 {
			code = res.StatusCode
		}
		httperror.WriteErrorResponse(w, err, code, nil)
		return
	}
	defer res.Body.Close()

	for k, vv := range res.Header {
		for _, v := range vv {
			w.Header().Add(k, v)
		}
	}
	if _, err := io.Copy(w, res.Body); err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, nil)
	}
}
