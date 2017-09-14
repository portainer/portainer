package proxy

// unixSocketHandler represents a handler to proxy HTTP requests via a unix:// socket
import (
	"io"
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
)

type socketProxy struct {
	Transport *proxyTransport
}

func (proxy *socketProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
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

	w.WriteHeader(res.StatusCode)

	if _, err := io.Copy(w, res.Body); err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, nil)
	}
}
