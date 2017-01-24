package internal

import (
	"io"
	"net/http"
	"net/http/httputil"

	"gopkg.in/natefinch/npipe.v2"
)

// NewFileProxy returns a HTTP handler writing to a Windows named pipe.
func NewFileProxy(path string) http.Handler {
	return &namedPipehandler{path}
}

// namedPipehandler represents a handler to proxy HTTP requests via a Windows named pipe.
type namedPipehandler struct {
	pipe string
}

func (h *namedPipehandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := npipe.Dial(h.pipe)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	c := httputil.NewClientConn(conn, nil)
	defer c.Close()

	res, err := c.Do(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
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
