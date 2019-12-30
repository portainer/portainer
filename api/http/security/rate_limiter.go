package security

import (
	"net/http"
	"strings"
	"time"

	"github.com/g07cha/defender"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
)

// CatchStatusCodeResponseWriter implement ResponseWriter interface but also expose HTTP status code
type CatchStatusCodeResponseWriter struct {
	http.ResponseWriter
	StatusCode int
}

// NewCatchStatusCodeResponseWriter initialize a CatchStatusCodeResponseWriter from a ResponseWriter
func NewCatchStatusCodeResponseWriter(w http.ResponseWriter) *CatchStatusCodeResponseWriter {
	// WriteHeader(int) is not called if our response implicitly returns 200 OK, so
	// we default to that status code.
	return &CatchStatusCodeResponseWriter{w, http.StatusOK}
}

// WriteHeader overload ResponseWriter method in order to store the status code
func (rrw *CatchStatusCodeResponseWriter) WriteHeader(code int) {
	rrw.StatusCode = code
	rrw.ResponseWriter.WriteHeader(code)
}

// RateLimiter represents an entity that manages request rate limiting
type RateLimiter struct {
	*defender.Defender
}

// NewRateLimiter initializes a new RateLimiter
func NewRateLimiter(maxRequests int, duration time.Duration, banDuration time.Duration) *RateLimiter {
	messages := make(chan struct{})
	limiter := defender.New(maxRequests, duration, banDuration)
	go limiter.CleanupTask(messages)
	return &RateLimiter{
		limiter,
	}
}

// IsBanned return true if given IP is banned
func (limiter *RateLimiter) IsBanned(ip interface{}) bool {
	c, ok := limiter.Client(ip)
	if ok {
		return c.Banned()
	}
	return false
}

// LimitAccess wraps current request with check if remote address does not goes above the defined limits
func (limiter *RateLimiter) LimitAccess(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := StripAddrPort(r.RemoteAddr)
		if limiter.IsBanned(ip) {
			httperror.WriteError(w, http.StatusForbidden, "Access denied", portainer.ErrResourceAccessDenied)
			return
		}
		rw := NewCatchStatusCodeResponseWriter(w)
		next.ServeHTTP(rw, r)
		if rw.StatusCode >= 400 {
			limiter.Inc(ip)
		}
	})
}

// StripAddrPort removes port from IP address
func StripAddrPort(addr string) string {
	portIndex := strings.LastIndex(addr, ":")
	if portIndex != -1 {
		addr = addr[:portIndex]
	}
	return addr
}
