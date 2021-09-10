package kubernetes

import (
	"fmt"
	"net/http"
	"path"

	"github.com/portainer/portainer/api/http/security"
)

func (transport *baseTransport) proxySecretRequest(request *http.Request, namespace, requestPath string) (*http.Response, error) {
	switch request.Method {
	case "POST":
		return transport.proxySecretCreationOperation(request)
	case "GET":
		if path.Base(requestPath) == "secrets" {
			return transport.proxySecretListOperation(request)
		}
		return transport.proxySecretInspectOperation(request)
	case "PUT":
		return transport.proxySecretUpdateOperation(request)
	case "DELETE":
		return transport.proxySecretDeleteOperation(request, namespace)
	default:
		return transport.executeKubernetesRequest(request)
	}
}

func (transport *baseTransport) proxySecretCreationOperation(request *http.Request) (*http.Response, error) {
	return transport.executeKubernetesRequest(request)
}

func (transport *baseTransport) proxySecretListOperation(request *http.Request) (*http.Response, error) {
	response, err := transport.executeKubernetesRequest(request)
	if err != nil {
		return nil, err
	}

	isAdmin, err := security.IsAdmin(request)
	if err != nil {
		return nil, err
	}

	if !isAdmin {
		return nil, fmt.Errorf("User does not have the required permission to access this secret")
	}

	return response, nil
}

func (transport *baseTransport) proxySecretInspectOperation(request *http.Request) (*http.Response, error) {
	response, err := transport.executeKubernetesRequest(request)
	if err != nil {
		return nil, err
	}

	isAdmin, err := security.IsAdmin(request)
	if err != nil {
		return nil, err
	}

	if !isAdmin {
		return nil, fmt.Errorf("User does not have the required permission to access this secret")
	}

	return response, nil
}

func (transport *baseTransport) proxySecretUpdateOperation(request *http.Request) (*http.Response, error) {
	return transport.executeKubernetesRequest(request)
}

func (transport *baseTransport) proxySecretDeleteOperation(request *http.Request, namespace string) (*http.Response, error) {
	return transport.executeKubernetesRequest(request)
}
