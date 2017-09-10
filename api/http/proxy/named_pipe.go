package proxy

// unixSocketHandler represents a handler to proxy HTTP requests via a unix:// socket
import (
	"io"
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
)

type namePipeProxy struct {
	Transport *proxyTransport
}

func (proxy *namePipeProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
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
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
