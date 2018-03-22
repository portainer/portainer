package handler

import (
	"os"

	"log"
	"net/http"
	"strings"
)

// FileHandler represents an HTTP API handler for managing static files.
type FileHandler struct {
	http.Handler
	Logger *log.Logger
}

// NewFileHandler returns a new instance of FileHandler.
func NewFileHandler(assetPublicPath string) *FileHandler {
	h := &FileHandler{
		Handler: http.FileServer(http.Dir(assetPublicPath)),
		Logger:  log.New(os.Stderr, "", log.LstdFlags),
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

func (handler *FileHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if !isHTML(r.Header["Accept"]) {
		w.Header().Set("Cache-Control", "max-age=31536000")
		w.Header().Set("X-XSS-Protection", "\"1; mode=block\"")
		w.Header().Set("X-Frame-Options", "SAMEORIGIN")
		w.Header().Set("X-Content-Type-Options", "nosniff")
	} else {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	}
	handler.Handler.ServeHTTP(w, r)
}
