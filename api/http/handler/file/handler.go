package file

import (
	"github.com/lpar/gzipped/v2"

	"net/http"
	"path"
	"strings"
)

// Handler represents an HTTP API handler for managing static files.
type Handler struct {
	http.Handler
}

// NewHandler creates a handler to serve static files.
func NewHandler(assetPublicPath string) *Handler {
	h := &Handler{
		Handler: withIndexHTML(gzipped.FileServer(gzipped.Dir(assetPublicPath))),
	}
	return h
}

func withIndexHTML(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") {
			newpath := path.Join(r.URL.Path, "index.html")
			r.URL.Path = newpath
		}
		h.ServeHTTP(w, r)
	})
}

func isHTML(acceptContent []string) bool {
	for _, accept := range acceptContent {
		if strings.Contains(accept, "text/html") {
			return true
		}
	}
	return false
}

func (handler *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if !isHTML(r.Header["Accept"]) {
		w.Header().Set("Cache-Control", "max-age=31536000")
	} else {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	}

	w.Header().Add("X-XSS-Protection", "1; mode=block")
	w.Header().Add("X-Content-Type-Options", "nosniff")
	handler.Handler.ServeHTTP(w, r)
}
