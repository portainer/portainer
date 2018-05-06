package security

import (
	"net/http"
	"strings"
	"time"

	"github.com/g07cha/defender"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
)

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

// LimitAccess wraps current request with check if remote address does not goes above the defined limits
func (limiter *RateLimiter) LimitAccess(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if banned := limiter.Inc(r.RemoteAddr); banned == true {
			httperror.WriteErrorResponse(w, portainer.ErrResourceAccessDenied, http.StatusForbidden, nil)
			return
		}
		next.ServeHTTP(w, r)
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
