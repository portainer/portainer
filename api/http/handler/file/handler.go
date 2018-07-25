package file

import (
	"net/http"
	"os"
	"path"
	"strings"
)

// Handler represents an HTTP API handler for managing static files.
type Handler struct {
	http.Handler
	AssetPath string
}

// NewHandler creates a handler to serve static files.
func NewHandler(assetPublicPath string) *Handler {
	h := &Handler{
		Handler:   http.FileServer(http.Dir(assetPublicPath)),
		AssetPath: assetPublicPath,
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

	_, err := os.Open(path.Join(handler.AssetPath, path.Clean(r.URL.Path)))
	if os.IsNotExist(err) {
		http.ServeFile(w, r, path.Join(handler.AssetPath, "index.html"))
	} else {
		handler.Handler.ServeHTTP(w, r)
	}
}
