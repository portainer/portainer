package handler

import (
	"net/http"
	"strings"
)

// FileHandler represents an HTTP API handler for managing static files.
type FileHandler struct {
	http.Handler
}

// NewFileHandler returns a new instance of FileHandler.
func NewFileHandler(assetPath string) *FileHandler {
	h := &FileHandler{
		Handler: http.FileServer(http.Dir(assetPath)),
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

func (fileHandler *FileHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if !isHTML(r.Header["Accept"]) {
		w.Header().Set("Cache-Control", "max-age=31536000")
	} else {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	}
	fileHandler.Handler.ServeHTTP(w, r)
}
