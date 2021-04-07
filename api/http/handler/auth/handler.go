package auth

import (
	"log"
	"net/http"
	"regexp"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
)

// Handler is the HTTP handler used to handle authentication operations.
type Handler struct {
	*mux.Router
	DataStore                   portainer.DataStore
	CryptoService               portainer.CryptoService
	JWTService                  portainer.JWTService
	LDAPService                 portainer.LDAPService
	LicenseService              portainer.LicenseService
	OAuthService                portainer.OAuthService
	ProxyManager                *proxy.Manager
	KubernetesTokenCacheManager *kubernetes.TokenCacheManager
	AuthorizationService        *authorization.Service
	UserActivityStore           portainer.UserActivityStore
}

// NewHandler creates a handler to manage authentication operations.
func NewHandler(bouncer *security.RequestBouncer, rateLimiter *security.RateLimiter) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/auth/oauth/validate",
		rateLimiter.LimitAccess(bouncer.PublicAccess(httperror.LoggerHandler(h.authActivityMiddleware(h.validateOAuth, portainer.AuthenticationActivitySuccess))))).Methods(http.MethodPost)
	h.Handle("/auth",
		rateLimiter.LimitAccess(bouncer.PublicAccess(httperror.LoggerHandler(h.authActivityMiddleware(h.authenticate, portainer.AuthenticationActivitySuccess))))).Methods(http.MethodPost)
	h.Handle("/auth/logout",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.authActivityMiddleware(h.logout, portainer.AuthenticationActivityLogOut)))).Methods(http.MethodPost)

	return h
}

type authMiddlewareHandler func(http.ResponseWriter, *http.Request) (*authMiddlewareResponse, *httperror.HandlerError)

type authMiddlewareResponse struct {
	Username string
	Method   portainer.AuthenticationMethod
}

func (handler *Handler) authActivityMiddleware(prev authMiddlewareHandler, defaultActivityType portainer.AuthenticationActivityType) httperror.LoggerHandler {
	return func(rw http.ResponseWriter, r *http.Request) *httperror.HandlerError {
		resp, respErr := prev(rw, r)

		method := resp.Method
		if int(method) == 0 {
			method = portainer.AuthenticationInternal
		}

		activityType := defaultActivityType
		if respErr != nil && activityType == portainer.AuthenticationActivitySuccess {
			activityType = portainer.AuthenticationActivityFailure
		}

		origin := getOrigin(r.RemoteAddr)

		_, err := handler.UserActivityStore.LogAuthActivity(resp.Username, origin, method, activityType)
		if err != nil {
			log.Printf("[ERROR] [msg: Failed logging auth activity] [error: %s]", err)
		}

		return respErr
	}
}

func getOrigin(addr string) string {
	ipRegex := regexp.MustCompile(`:\d+$`)
	ipSplit := ipRegex.Split(addr, -1)
	if len(ipSplit) == 0 {
		return ""
	}

	return ipSplit[0]
}
