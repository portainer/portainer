package storybook

import (
	"net/http"

	"github.com/portainer/portainer/api/filesystem"
)

// Handler represents an HTTP API handler for managing static files.
type Handler struct {
	http.Handler
}

// NewHandler creates a handler to serve static files.
func NewHandler(assetsPath string) *Handler {
	h := &Handler{
		http.FileServer(http.Dir(filesystem.JoinPaths(assetsPath, "storybook"))),
	}
	return h
}

func (handler *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	handler.Handler.ServeHTTP(w, r)
}
