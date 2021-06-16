package kubernetes

import (
	"net/http"
	"path"

	"github.com/portainer/portainer/api/http/proxy/factory/utils"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes/privateregistries"
	v1 "k8s.io/api/core/v1"
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
	body, err := utils.GetRequestAsMap(request)
	if err != nil {
		return nil, err
	}

	if isSecretRepresentPrivateRegistry(body) {
		return utils.WriteAccessDeniedResponse()
	}

	err = utils.RewriteRequest(request, body)
	if err != nil {
		return nil, err
	}

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

	if isAdmin {
		return response, nil
	}

	body, err := utils.GetResponseAsJSONObject(response)
	if err != nil {
		return nil, err
	}

	items := utils.GetArrayObject(body, "items")

	if items == nil {
		utils.RewriteResponse(response, body, response.StatusCode)
		return response, nil
	}

	filteredItems := []interface{}{}
	for _, item := range items {
		itemObj := item.(map[string]interface{})
		if !isSecretRepresentPrivateRegistry(itemObj) {
			filteredItems = append(filteredItems, item)
		}
	}

	body["items"] = filteredItems

	utils.RewriteResponse(response, body, response.StatusCode)
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

	if isAdmin {
		return response, nil
	}

	body, err := utils.GetResponseAsJSONObject(response)
	if err != nil {
		return nil, err
	}

	if isSecretRepresentPrivateRegistry(body) {
		return utils.WriteAccessDeniedResponse()
	}

	err = utils.RewriteResponse(response, body, response.StatusCode)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (transport *baseTransport) proxySecretUpdateOperation(request *http.Request) (*http.Response, error) {
	body, err := utils.GetRequestAsMap(request)
	if err != nil {
		return nil, err
	}

	if isSecretRepresentPrivateRegistry(body) {
		return utils.WriteAccessDeniedResponse()
	}

	err = utils.RewriteRequest(request, body)
	if err != nil {
		return nil, err
	}

	return transport.executeKubernetesRequest(request)
}

func (transport *baseTransport) proxySecretDeleteOperation(request *http.Request, namespace string) (*http.Response, error) {
	kcl, err := transport.k8sClientFactory.GetKubeClient(transport.endpoint)
	if err != nil {
		return nil, err
	}

	secretName := path.Base(request.RequestURI)

	isRegistry, err := kcl.IsRegistrySecret(namespace, secretName)
	if err != nil {
		return nil, err
	}

	if isRegistry {
		return utils.WriteAccessDeniedResponse()
	}

	return transport.executeKubernetesRequest(request)
}

func isSecretRepresentPrivateRegistry(secret map[string]interface{}) bool {
	if secret["type"].(string) != string(v1.SecretTypeDockerConfigJson) {
		return false
	}

	metadata := utils.GetJSONObject(secret, "metadata")
	annotations := utils.GetJSONObject(metadata, "annotations")
	_, ok := annotations[privateregistries.RegistryIDLabel]

	return ok
}
