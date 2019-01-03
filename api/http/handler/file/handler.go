package file

import (
	"net/http"
	"path/filepath"
	"strings"
)

// Handler represents an HTTP API handler for managing static files.
type Handler struct {
	http.Handler
	assetPublicPath string
}

// NewHandler creates a handler to serve static files.
func NewHandler(assetPublicPath string) *Handler {
	h := &Handler{
		Handler:         http.FileServer(http.Dir(assetPublicPath)),
		assetPublicPath: assetPublicPath,
	}
	return h
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

	if strings.HasPrefix(r.URL.Path, "/assets/") {
		handler.Handler.ServeHTTP(w, r)
	} else {
		http.ServeFile(w, r, filepath.Join(handler.assetPublicPath, "index.html"))
	}
}
