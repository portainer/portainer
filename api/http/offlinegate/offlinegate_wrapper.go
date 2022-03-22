package offlinegate

import (
	"log"
	"net/http"
	"strings"
	"sync"

	httperror "github.com/portainer/libhttp/error"
)

const RedirectReasonAdminInitTimeout string = "AdminInitTimeout"

// OfflineGateWrapper is an entity used to maintain the administrator initialization status
type OfflineGateWrapper struct {
	lock              *sync.Mutex
	adminInitDisabled bool
}

// NewOfflineGateWrapper creates a new gate wrapper
func NewOfflineGateWrapper(timeoutCh chan interface{}) *OfflineGateWrapper {
	gateWrapper := &OfflineGateWrapper{
		lock:              &sync.Mutex{},
		adminInitDisabled: false,
	}

	go func() {
		<-timeoutCh
		log.Println("[INFO] Please restart Portainer instance and initialize the administrator")
		gateWrapper.DisableInstance()
	}()
	return gateWrapper
}

func (o *OfflineGateWrapper) DisableInstance() {
	o.lock.Lock()
	defer o.lock.Unlock()
	o.adminInitDisabled = true
}

func (o *OfflineGateWrapper) WasDisabled() bool {
	return o.adminInitDisabled
}

// WaitingMiddlewareWrapper checks whether administrator initialisation timeout. If so, it will return the error with redirect reason,
// Otherwise, it will pass through the request to next
func (o *OfflineGateWrapper) WaitingMiddlewareWrapper(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if o.WasDisabled() && strings.HasPrefix(r.RequestURI, "/api") {
			if r.RequestURI != "/api/status" {
				w.Header().Set("redirect_reason", RedirectReasonAdminInitTimeout)
				httperror.WriteError(w, http.StatusPermanentRedirect, "Administrator initialization timeout", nil)
				return
			}
		}

		next.ServeHTTP(w, r)
	})

}
