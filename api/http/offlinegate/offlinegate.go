package offlinegate

import (
	"log"
	"net/http"
	"time"

	httperror "github.com/portainer/libhttp/error"
	lock "github.com/viney-shih/go-lock"
)

// OfflineGate is an entity that works similar to a mutex with signaling
// Only the caller that has Locked a gate can unlock it, otherwise it will be blocked with a call to Lock.
// Gate provides a passthrough http middleware that will wait for a locked gate to be unlocked.
// For safety reasons, the middleware will timeout
type OfflineGate struct {
	lock *lock.CASMutex
}

// NewOfflineGate creates a new gate
func NewOfflineGate() *OfflineGate {
	return &OfflineGate{
		lock: lock.NewCASMutex(),
	}
}

// Lock locks readonly gate and returns a function to unlock
func (o *OfflineGate) Lock() func() {
	o.lock.Lock()
	return o.lock.Unlock
}

// WaitingMiddleware returns an http handler that waits for the gate to be unlocked before continuing
func (o *OfflineGate) WaitingMiddleware(timeout time.Duration, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" && r.Method != "HEAD" && r.Method != "OPTIONS" && !o.lock.RTryLockWithTimeout(timeout) {
			log.Println("error: Timeout waiting for the offline gate to signal")
			httperror.WriteError(w, http.StatusRequestTimeout, "Timeout waiting for the offline gate to signal", http.ErrHandlerTimeout)
			return
		}

		next.ServeHTTP(w, r)
	})
}
