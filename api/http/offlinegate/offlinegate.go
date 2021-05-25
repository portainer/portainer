package offlinegate

import (
	"log"
	"net/http"
	"sync"
	"time"

	httperror "github.com/portainer/libhttp/error"
)

// OfflineGate is a entity that works similar to a mutex with a signaling
// Only the caller that have Locked an gate can unlock it, otherw will be blocked with a call to Lock.
// Gate provides a passthrough http middleware that will wait for a locked gate to be unlocked.
// For a safety reasons, middleware will timeout
type OfflineGate struct {
	lock        *sync.Mutex
	signalingCh chan interface{}
}

// NewOfflineGate creates a new gate
func NewOfflineGate() *OfflineGate {
	return &OfflineGate{
		lock: &sync.Mutex{},
	}
}

// Lock locks readonly gate and returns a function to unlock
func (o *OfflineGate) Lock() func() {
	o.lock.Lock()
	o.signalingCh = make(chan interface{})
	return o.unlock
}

func (o *OfflineGate) unlock() {
	if o.signalingCh == nil {
		return
	}

	close(o.signalingCh)
	o.signalingCh = nil
	o.lock.Unlock()
}

// Watch returns a signaling channel.
// Unless channel is nil, client needs to watch for a signal on a channel to know when gate is unlocked.
// Signal channel is disposable: onced signaled, has to be disposed and acquired again.
func (o *OfflineGate) Watch() chan interface{} {
	return o.signalingCh
}

// WaitingMiddleware returns an http handler that waits for the gate to be unlocked before continuing
func (o *OfflineGate) WaitingMiddleware(timeout time.Duration, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		signalingCh := o.Watch()

		if signalingCh != nil {
			if r.Method != "GET" && r.Method != "HEAD" && r.Method != "OPTIONS" {
				select {
				case <-signalingCh:
				case <-time.After(timeout):
					log.Println("error: Timeout waiting for the offline gate to signal")
					httperror.WriteError(w, http.StatusRequestTimeout, "Timeout waiting for the offline gate to signal", http.ErrHandlerTimeout)
				}
			}
		}

		next.ServeHTTP(w, r)

	})
}
