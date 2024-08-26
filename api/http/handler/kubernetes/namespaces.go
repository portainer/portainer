package kubernetes

import (
	"fmt"
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// @id GetKubernetesNamespaces
// @summary Get a list of kubernetes namespaces within the given Portainer environment
// @description Get a list of all kubernetes namespaces within the given environment based on the user role and permissions.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param withResourceQuota query boolean true "When set to true, include the resource quota information as part of the Namespace information. It is set to false by default"
// @success 200 {object} map[string]portainer.K8sNamespaceInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve the list of namespaces."
// @router /kubernetes/{id}/namespaces [get]
func (handler *Handler) getKubernetesNamespaces(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	withResourceQuota, err := request.RetrieveBooleanQueryParameter(r, "withResourceQuota", true)
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesNamespaces operation, invalid query parameter withResourceQuota. Error: ", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesNamespaces operation, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	namespaces, err := cli.GetNamespaces()
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesNamespaces operation, unable to retrieve namespaces from the Kubernetes for the user. Error: ", err)
	}

	if withResourceQuota {
		return cli.CombineNamespacesWithResourceQuotas(namespaces, w)
	}

	return response.JSON(w, cli.ConvertNamespaceMapToSlice(namespaces))
}

// @id GetKubernetesNamespacesCount
// @summary Get the total number of kubernetes namespaces within the given Portainer environment.
// @description Get the total number of kubernetes namespaces within the given environment, including the system namespaces. The total count depends on the user's role and permissions.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {integer} integer "Success"
// @failure 400 "Invalid request"
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to compute the namespace count."
// @router /kubernetes/{id}/namespaces/count [get]
func (handler *Handler) getKubernetesNamespacesCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesNamespacesCount operation, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	namespaces, err := cli.GetNamespaces()
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesNamespacesCount operation, unable to retrieve namespaces from the Kubernetes cluster to count the total. Error: ", err)
	}

	return response.JSON(w, len(namespaces))
}

// @id GetKubernetesNamespace
// @summary Get kubernetes namespace details
// @description Get kubernetes namespace details for the provided namespace within the given environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "The namespace name to get details for"
// @param withResourceQuota query boolean true "When set to true, include the resource quota information as part of the Namespace information. It is set to false by default"
// @success 200 {object} portainer.K8sNamespaceInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve specified namespace information."
// @router /kubernetes/{id}/namespaces/{namespace} [get]
func (handler *Handler) getKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespaceName, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesNamespace operation, invalid namespace parameter namespace. Error: ", err)
	}

	withResourceQuota, err := request.RetrieveBooleanQueryParameter(r, "withResourceQuota", true)
	if err != nil {
		return httperror.BadRequest(fmt.Sprintf("an error occurred during the GetKubernetesNamespace operation for the namespace %s, invalid query parameter withResourceQuota. Error: ", namespaceName), err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httperror.InternalServerError(fmt.Sprintf("an error occurred during the GetKubernetesNamespace operation for the namespace %s, unable to get a Kubernetes client for the user. Error: ", namespaceName), httpErr)
	}

	namespaceInfo, err := cli.GetNamespace(namespaceName)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			return httperror.NotFound(fmt.Sprintf("an error occurred during the GetKubernetesNamespace operation for the namespace %s, unable to find the namespace. Error: ", namespaceName), err)
		}

		if k8serrors.IsUnauthorized(err) {
			return httperror.Unauthorized(fmt.Sprintf("an error occurred during the GetKubernetesNamespace operation, unauthorized to access the namespace: %s. Error: ", namespaceName), err)
		}

		return httperror.InternalServerError(fmt.Sprintf("an error occurred during the GetKubernetesNamespace operation, unable to get the namespace: %s. Error: ", namespaceName), err)
	}

	if withResourceQuota {
		return cli.CombineNamespaceWithResourceQuota(namespaceInfo, w)
	}

	return response.JSON(w, namespaceInfo)
}

// @id CreateKubernetesNamespace
// @summary Create a kubernetes namespace
// @description Create a kubernetes namespace within the given environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param body body models.K8sNamespaceDetails true "Namespace configuration details"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to create the namespace."
// @router /kubernetes/{id}/namespaces [post]
func (handler *Handler) createKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := models.K8sNamespaceDetails{}
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("an error occurred during the CreateKubernetesNamespace operation, invalid request payload. Error: ", err)
	}

	namespaceName := payload.Name
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httperror.InternalServerError(fmt.Sprintf("an error occurred during the CreateKubernetesNamespace operation for the namespace %s, unable to get a Kubernetes client for the user. Error: ", namespaceName), httpErr)
	}

	namespace, err := cli.CreateNamespace(payload)
	if err != nil {
		if k8serrors.IsAlreadyExists(err) {
			return httperror.Conflict(fmt.Sprintf("an error occurred during the CreateKubernetesNamespace operation, the namespace %s already exists. Error: ", namespaceName), err)
		}

		return httperror.InternalServerError(fmt.Sprintf("an error occurred during the CreateKubernetesNamespace operation, unable to create the namespace: %s", namespaceName), err)
	}

	return response.JSON(w, namespace)
}

// @id DeleteKubernetesNamespace
// @summary Delete a kubernetes namespace
// @description Delete a kubernetes namespace within the given environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to delete the namespace."
// @router /kubernetes/{id}/namespaces/{namespace} [delete]
func (handler *Handler) deleteKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespaceName, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("an error occurred during the DeleteKubernetesNamespace operation, invalid namespace identifier route variable. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httperror.InternalServerError(fmt.Sprintf("an error occurred during the DeleteKubernetesNamespace operation for the namespace %s, unable to get a Kubernetes client for the user. Error: ", namespaceName), httpErr)
	}

	namespace, err := cli.DeleteNamespace(namespaceName)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			return httperror.NotFound(fmt.Sprintf("an error occurred during the DeleteKubernetesNamespace operation for the namespace %s, unable to find the namespace. Error: ", namespace), err)
		}

		return httperror.InternalServerError(fmt.Sprintf("an error occurred during the DeleteKubernetesNamespace operation for the namespace %s, unable to delete the Kubernetes namespace. Error: ", namespace), err)
	}

	return response.JSON(w, namespace)
}

// @id UpdateKubernetesNamespace
// @summary Update a kubernetes namespace
// @description Update a kubernetes namespace within the given environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace"
// @param body body models.K8sNamespaceDetails true "Namespace details"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to update the namespace."
// @router /kubernetes/{id}/namespaces/{namespace} [put]
func (handler *Handler) updateKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := models.K8sNamespaceDetails{}
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("an error occurred during the UpdateKubernetesNamespace operation, invalid request payload. Error: ", err)
	}

	namespaceName := payload.Name
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httperror.InternalServerError(fmt.Sprintf("an error occurred during the UpdateKubernetesNamespace operation for the namespace %s, unable to get a Kubernetes client for the user. Error: ", namespaceName), httpErr)
	}

	namespace, err := cli.UpdateNamespace(payload)
	if err != nil {
		return httperror.InternalServerError(fmt.Sprintf("an error occurred during the UpdateKubernetesNamespace operation for the namespace %s, unable to update the Kubernetes namespace. Error: ", namespaceName), err)
	}

	return response.JSON(w, namespace)
}
