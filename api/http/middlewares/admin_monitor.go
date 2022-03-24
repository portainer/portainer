package middlewares

import (
	"log"
	"net/http"
	"strings"
	"sync"

	httperror "github.com/portainer/libhttp/error"
)

const RedirectReasonAdminInitTimeout string = "AdminInitTimeout"

// AdminMonitor is an entity used to maintain the administrator initialization status
type AdminMonitor struct {
	lock              sync.RWMutex
	adminInitDisabled bool
}

//  NewAdminMonitor creates a new gate wrapper
func NewAdminMonitor(timeoutSignal <-chan interface{}) *AdminMonitor {
	monitor := &AdminMonitor{
		adminInitDisabled: false,
	}

	go func() {
		<-timeoutSignal
		log.Println("[INFO] Please restart Portainer instance and initialize the administrator")
		monitor.DisableInstance()
	}()
	return monitor
}

func (o *AdminMonitor) DisableInstance() {
	o.lock.Lock()
	defer o.lock.Unlock()
	o.adminInitDisabled = true
}

func (o *AdminMonitor) WasDisabled() bool {
	o.lock.RLock()
	defer o.lock.RUnlock()
	return o.adminInitDisabled
}

// WithRedirect checks whether administrator initialisation timeout. If so, it will return the error with redirect reason.
// Otherwise, it will pass through the request to next
func (o *AdminMonitor) WithRedirect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if o.WasDisabled() && strings.HasPrefix(r.RequestURI, "/api") && r.RequestURI != "/api/status" && r.RequestURI != "/api/settings/public" {
			w.Header().Set("redirect-reason", RedirectReasonAdminInitTimeout)
			httperror.WriteError(w, http.StatusTemporaryRedirect, "Administrator initialization timeout", nil)
			return
		}

		next.ServeHTTP(w, r)
	})
}
