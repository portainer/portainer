package kubernetes

import (
	"fmt"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/middlewares"
	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GetKubernetesNamespaces
// @summary Get a list of kubernetes namespaces within the given Portainer environment
// @description Get a list of all kubernetes namespaces within the given environment (Endpoint). The Endpoint ID must be a valid Portainer environment identifier.
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param withResourceQuota query boolean false "When set to True, include the resource quota information as part of the Namespace information. It is set to false by default"
// @success 200 {object} map[string]portaineree.K8sNamespaceInfo "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces [get]
func (handler *Handler) GetKubernetesNamespaces(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespaces, err := handler.getKubernetesNamespaces(w, r)
	if err != nil {
		return err
	}

	return response.JSON(w, namespaces)
}

// @id GetKubernetesNamespacesCount
// @summary Get the total number of kubernetes namespaces within the given Portainer environment.
// @description Get the total number of kubernetes namespaces within the given environment (Endpoint), including the system namespaces. The total count depends on the user's role and permissions. The Endpoint ID must be a valid Portainer environment identifier.
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @success 200 {integer} integer "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/count [get]
func (handler *Handler) getKubernetesNamespacesCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespaces, err := handler.getKubernetesNamespaces(w, r)
	if err != nil {
		return err
	}

	return response.JSON(w, len(namespaces))
}

func (handler *Handler) getKubernetesNamespaces(w http.ResponseWriter, r *http.Request) (map[string]portainer.K8sNamespaceInfo, *httperror.HandlerError) {
	withResourceQuota, err := request.RetrieveBooleanQueryParameter(r, "withResourceQuota", true)
	if err != nil {
		return nil, httperror.BadRequest("an error occurred during the getKubernetesNamespaces operation, invalid query parameter withResourceQuota. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return nil, httperror.InternalServerError("an error occurred during the getKubernetesNamespacesCount operation, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return nil, httperror.NotFound("Unable to find an environment on request context", err)
	}

	pcli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return nil, httperror.InternalServerError("an error occurred during the getKubernetesNamespaces operation, unable to get a privileged Kubernetes client for the user. Error: ", err)
	}
	pcli.IsKubeAdmin = cli.IsKubeAdmin
	pcli.NonAdminNamespaces = cli.NonAdminNamespaces

	namespaces, err := pcli.GetNamespaces()
	if err != nil {
		return nil, httperror.InternalServerError("an error occurred during the getKubernetesNamespaces operation, unable to retrieve namespaces from the Kubernetes cluster. Error: ", err)
	}

	if withResourceQuota {
		return pcli.CombineNamespacesWithResourceQuotas(namespaces, w)
	}

	return namespaces, nil
}

// @id GetKubernetesNamespace
// @summary Get kubernetes namespace details
// @description Get kubernetes namespace details for the provided namespace within the given environment
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "The namespace name to get details for"
// @param withResourceQuota query boolean true "When set to True, include the resource quota information as part of the Namespace information. It is set to false by default"
// @success 200 {object} portaineree.K8sNamespaceInfo "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace} [get]
func (handler *Handler) getKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("an error occurred during the getKubernetesNamespace operation, invalid namespace parameter namespace. Error: ", err)
	}

	withResourceQuota, err := request.RetrieveBooleanQueryParameter(r, "withResourceQuota", true)
	if err != nil {
		return httperror.BadRequest(fmt.Sprintf("an error occurred during the getKubernetesNamespace operation for the namespace %s, invalid query parameter withResourceQuota. Error: ", namespace), err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httperror.InternalServerError(fmt.Sprintf("an error occurred during the getKubernetesNamespace operation for the namespace %s, unable to get a Kubernetes client for the user. Error: ", namespace), httpErr)
	}

	namespaceInfo, err := cli.GetNamespace(namespace)
	if err != nil {
		return httperror.InternalServerError(fmt.Sprintf("an error occurred during the getKubernetesNamespace operation, unable to get the namespace: %s. Error: ", namespace), err)
	}

	// if withResourceQuota is set to true, grab a resource quota associated to the namespace
	if withResourceQuota {
		return cli.CombineNamespaceWithResourceQuota(namespaceInfo, w)
	}

	return response.JSON(w, namespace)
}

// @id createKubernetesNamespace
// @summary Create a kubernetes namespace
// @description Create a kubernetes namespace within the given environment
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param body body models.K8sNamespaceDetails true "Namespace configuration details"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces [post]
func (handler *Handler) createKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload models.K8sNamespaceDetails
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.CreateNamespace(payload)
	if err != nil {
		return httperror.InternalServerError("Unable to create namespace", err)
	}

	return nil
}

// @id deleteKubernetesNamespace
// @summary Delete kubernetes namespace
// @description Delete a kubernetes namespace within the given environment
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Namespace"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace} [delete]
func (handler *Handler) deleteKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload models.K8sNamespaceDetails
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("Invalid namespace identifier route variable", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.DeleteNamespace(namespace)
	if err != nil {
		return httperror.InternalServerError("Unable to delete namespace", err)
	}

	return nil
}

// @id updateKubernetesNamespace
// @summary Updates a kubernetes namespace
// @description Update a kubernetes namespace within the given environment
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param body body models.K8sNamespaceDetails true "Namespace details"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace} [put]
func (handler *Handler) updateKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload models.K8sNamespaceDetails
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.UpdateNamespace(payload)
	if err != nil {
		return httperror.InternalServerError("Unable to update namespace", err)
	}
	return nil
}
