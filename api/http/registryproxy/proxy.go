package registryproxy

import (
	"net/http"
	"strings"

	cmap "github.com/orcaman/concurrent-map"
	portainer "github.com/portainer/portainer/api"
)

// Service represents a service used to manage registry proxies.
type Service struct {
	proxies           cmap.ConcurrentMap
	userActivityStore portainer.UserActivityStore
}

// NewService returns a pointer to a Service.
func NewService(userActivityStore portainer.UserActivityStore) *Service {
	return &Service{
		proxies:           cmap.New(),
		userActivityStore: userActivityStore,
	}
}

// GetProxy returns the registry proxy associated to a key if it exists.
// Otherwise, it will create it and return it.
func (service *Service) GetProxy(key, uri string, config *portainer.RegistryManagementConfiguration, forceCreate bool) (http.Handler, error) {
	proxy, ok := service.proxies.Get(key)
	if ok && !forceCreate {
		return proxy.(http.Handler), nil
	}

	return service.createProxy(key, uri, config)
}

func (service *Service) createProxy(key, uri string, config *portainer.RegistryManagementConfiguration) (http.Handler, error) {
	var proxy http.Handler
	var err error

	switch config.Type {
	case portainer.AzureRegistry:
		proxy, err = newTokenSecuredRegistryProxy(uri, config, service.userActivityStore)
	case portainer.GitlabRegistry:
		if strings.Contains(key, "gitlab") {
			proxy, err = newGitlabRegistryProxy(uri, config, service.userActivityStore)
		} else {
			proxy, err = newTokenSecuredRegistryProxy(uri, config, service.userActivityStore)
		}
	default:
		proxy, err = newCustomRegistryProxy(uri, config, service.userActivityStore)
	}

	if err != nil {
		return nil, err
	}

	service.proxies.Set(key, proxy)
	return proxy, nil
}
