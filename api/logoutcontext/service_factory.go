package logoutcontext

import "sync"

type (
	ServiceFactory struct {
		mu       sync.Mutex
		services map[string]*Service
	}
)

var serviceFactory = ServiceFactory{
	services: make(map[string]*Service),
}

func GetService(token string) *Service {
	serviceFactory.mu.Lock()
	defer serviceFactory.mu.Unlock()

	service, ok := serviceFactory.services[token]
	if !ok {
		service = NewService()
		serviceFactory.services[token] = service
	}

	return service
}

func RemoveService(token string) {
	serviceFactory.mu.Lock()
	defer serviceFactory.mu.Unlock()

	delete(serviceFactory.services, token)
}
