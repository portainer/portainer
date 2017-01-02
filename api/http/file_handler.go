package http

import "net/http"

// FileHandler represents an HTTP API handler for managing static files.
type FileHandler struct {
	http.Handler
}

func newFileHandler(assetPath string) *FileHandler {
	h := &FileHandler{
		Handler: http.FileServer(http.Dir(assetPath)),
	}
	return h
}

func (fileHandler *FileHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age=31536000")
	fileHandler.Handler.ServeHTTP(w, r)
}
