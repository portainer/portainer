package tmp

// import (
// 	"net/http"
// 	"net/url"
//
// 	"github.com/orcaman/concurrent-map"
// 	"github.com/portainer/portainer"
// )
//
// // ProxyService represents a service used to manage Docker proxies.
// type ProxyService struct {
// 	proxyFactory *ProxyFactory
// 	proxies      cmap.ConcurrentMap
// }
//
// // NewProxyService initializes a new ProxyService
// func NewProxyService(resourceControlService portainer.ResourceControlService, teamService portainer.TeamService) *ProxyService {
// 	return &ProxyService{
// 		proxies: cmap.New(),
// 		proxyFactory: &ProxyFactory{
// 			ResourceControlService: resourceControlService,
// 			TeamService:            teamService,
// 		},
// 	}
// }
//
// // CreateAndRegisterProxy creates a new HTTP reverse proxy and adds it to the registered proxies.
// // It can also be used to create a new HTTP reverse proxy and replace an already registered proxy.
// func (service *ProxyService) CreateAndRegisterProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
// 	var proxy http.Handler
//
// 	endpointURL, err := url.Parse(endpoint.URL)
// 	if err != nil {
// 		return nil, err
// 	}
//
// 	if endpointURL.Scheme == "tcp" {
// 		if endpoint.TLS {
// 			proxy, err = service.proxyFactory.newHTTPSProxy(endpointURL, endpoint)
// 			if err != nil {
// 				return nil, err
// 			}
// 		} else {
// 			proxy = service.proxyFactory.newHTTPProxy(endpointURL)
// 		}
// 	} else {
// 		// Assume unix:// scheme
// 		proxy = service.proxyFactory.newSocketProxy(endpointURL.Path)
// 	}
//
// 	service.proxies.Set(string(endpoint.ID), proxy)
// 	return proxy, nil
// }
//
// // GetProxy returns the proxy associated to a key
// func (service *ProxyService) GetProxy(key string) http.Handler {
// 	proxy, ok := service.proxies.Get(key)
// 	if !ok {
// 		return nil
// 	}
// 	return proxy.(http.Handler)
// }
//
// // DeleteProxy deletes the proxy associated to a key
// func (service *ProxyService) DeleteProxy(key string) {
// 	service.proxies.Remove(key)
// }
