package middlewares

import (
	"net/http"
	"slices"

	"github.com/gorilla/csrf"
)

var (
	// Idempotent (safe) methods as defined by RFC7231 section 4.2.2.
	safeMethods = []string{"GET", "HEAD", "OPTIONS", "TRACE"}
)

type plainTextHTTPRequestHandler struct {
	next http.Handler
}

func (h *plainTextHTTPRequestHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if slices.Contains(safeMethods, r.Method) {
		h.next.ServeHTTP(w, r)
		return
	}

	req := r
	// If original request was HTTPS (via proxy), keep CSRF checks.
	if xfproto := r.Header.Get("X-Forwarded-Proto"); xfproto != "https" {
		req = csrf.PlaintextHTTPRequest(r)
	}

	h.next.ServeHTTP(w, req)
}

func PlaintextHTTPRequest(next http.Handler) http.Handler {
	return &plainTextHTTPRequestHandler{next: next}
}
