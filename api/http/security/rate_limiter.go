package security

import (
	"net"
	"net/http"
	"time"

	"github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/pkg/libhttp"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/g07cha/defender"
)

// RateLimiter represents an entity that manages request rate limiting
type RateLimiter struct {
	*defender.Defender
	trustedProxies []*net.IPNet
}

// NewRateLimiter initializes a new RateLimiter. trustedProxies is used to
// resolve the client IP from forwarding headers, as described on
// libhttp.ClientIP
func NewRateLimiter(maxRequests int, duration time.Duration, banDuration time.Duration, trustedProxies []*net.IPNet) *RateLimiter {
	messages := make(chan struct{})
	limiter := defender.New(maxRequests, duration, banDuration)
	go limiter.CleanupTask(messages)
	return &RateLimiter{
		Defender:       limiter,
		trustedProxies: trustedProxies,
	}
}

// LimitAccess wraps current request with check if remote address does not goes above the defined limits
func (limiter *RateLimiter) LimitAccess(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := libhttp.ClientIP(r, limiter.trustedProxies)
		if banned := limiter.Inc(ip); banned {
			httperror.WriteError(w, http.StatusForbidden, "Access denied", errors.ErrResourceAccessDenied)
			return
		}
		next.ServeHTTP(w, r)
	})
}
