package file

import (
	"net/http"
	"strings"

	"github.com/gorilla/handlers"
)

// Handler represents an HTTP API handler for managing static files.
type Handler struct {
	http.Handler
	wasInstanceDisabled func() bool
}

// NewHandler creates a handler to serve static files.
func NewHandler(assetPublicPath string, wasInstanceDisabled func() bool) *Handler {
	h := &Handler{
		Handler: handlers.CompressHandler(
			http.FileServer(http.Dir(assetPublicPath)),
		),
		wasInstanceDisabled: wasInstanceDisabled,
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
	if handler.wasInstanceDisabled() {
		if r.RequestURI == "/" || r.RequestURI == "/index.html" {
			http.Redirect(w, r, "/timeout.html", http.StatusTemporaryRedirect)
			return
		}
	} else {
		if strings.HasPrefix(r.RequestURI, "/timeout.html") {
			http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
			return
		}
	}

	if !isHTML(r.Header["Accept"]) {
		w.Header().Set("Cache-Control", "max-age=31536000")
	} else {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	}

	w.Header().Add("X-XSS-Protection", "1; mode=block")
	w.Header().Add("X-Content-Type-Options", "nosniff")
	handler.Handler.ServeHTTP(w, r)
}
