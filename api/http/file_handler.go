package http

import (
	"net/http"
	"os"
	"path"
	"strings"
)

// FileHandler represents an HTTP API handler for managing static files.
type FileHandler struct {
	http.Handler
	AssetPath       string
	NotFoundHandler http.Handler
}

func newFileHandler(assetPath string) *FileHandler {
	h := &FileHandler{
		Handler:         http.FileServer(http.Dir(assetPath)),
		AssetPath:       assetPath,
		NotFoundHandler: http.HandlerFunc(notFound),
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

func notFound(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "index.html")
}

func (fileHandler *FileHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if !isHTML(r.Header["Accept"]) {
		w.Header().Set("Cache-Control", "max-age=31536000")
	} else {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	}

	_, err := os.Open(path.Join(fileHandler.AssetPath, path.Clean(r.URL.Path)))
	if os.IsNotExist(err) {
		fileHandler.NotFoundHandler.ServeHTTP(w, r)
		return
	} else {
		fileHandler.Handler.ServeHTTP(w, r)
	}
}
