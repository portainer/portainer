package registries

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
)

// request on /api/registries/proxies/gitlab
func (handler *Handler) proxyRequestsToGitlabAPIWithoutRegistry(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	domain := r.Header.Get("X-Gitlab-Domain")
	if domain == "" {
		return &httperror.HandlerError{http.StatusBadRequest, "No Gitlab domain provided", nil}
	}

	proxy, err := handler.ProxyManager.CreateGitlabProxy(domain)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create gitlab proxy", err}
	}

	http.StripPrefix("/registries/proxies/gitlab", proxy).ServeHTTP(w, r)
	return nil
}
