package file

import (
	"net/http"
	"strings"
)

// Handler represents an HTTP API handler for managing static files.
type Handler struct {
	http.Handler
}

// NewHandler creates a handler to serve static files.
func NewHandler(assetPublicPath string) *Handler {
	h := &Handler{
		Handler: http.FileServer(http.Dir(assetPublicPath)),
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
	handler.Handler.ServeHTTP(w, r)
}
