package kubernetes

import (
	"errors"
	"fmt"
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// @id GetKubernetesNamespaces
// @summary Get a list of namespaces
// @description Get a list of all namespaces within the given environment based on the user role and permissions. If the user is an admin, they can access all namespaces. If the user is not an admin, they can only access namespaces that they have access to.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param withResourceQuota query boolean true "When set to true, include the resource quota information as part of the Namespace information. Default is false"
// @success 200 {array} portainer.K8sNamespaceInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the list of namespaces."
// @router /kubernetes/{id}/namespaces [get]
func (handler *Handler) getKubernetesNamespaces(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	withResourceQuota, err := request.RetrieveBooleanQueryParameter(r, "withResourceQuota", true)
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesNamespaces").Msg("Invalid query parameter withResourceQuota")
		return httperror.BadRequest("an error occurred during the GetKubernetesNamespaces operation, invalid query parameter withResourceQuota. Error: ", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetKubernetesNamespaces").Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("an error occurred during the GetKubernetesNamespaces operation, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	namespaces, err := cli.GetNamespaces()
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesNamespaces").Msg("Unable to retrieve namespaces from the Kubernetes cluster")
		return httperror.InternalServerError("an error occurred during the GetKubernetesNamespaces operation, unable to retrieve namespaces from the Kubernetes cluster. Error: ", err)
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
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to compute the namespace count."
// @router /kubernetes/{id}/namespaces/count [get]
func (handler *Handler) getKubernetesNamespacesCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetKubernetesNamespacesCount").Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("an error occurred during the GetKubernetesNamespacesCount operation, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	namespaces, err := cli.GetNamespaces()
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesNamespacesCount").Msg("Unable to retrieve namespaces from the Kubernetes cluster to count the total")
		return httperror.InternalServerError("an error occurred during the GetKubernetesNamespacesCount operation, unable to retrieve namespaces from the Kubernetes cluster to count the total. Error: ", err)
	}

	return response.JSON(w, len(namespaces))
}

// @id GetKubernetesNamespace
// @summary Get namespace details
// @description Get namespace details for the provided namespace within the given environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "The namespace name to get details for"
// @param withResourceQuota query boolean true "When set to true, include the resource quota information as part of the Namespace information. Default is false"
// @success 200 {object} portainer.K8sNamespaceInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find a specific namespace."
// @failure 500 "Server error occurred while attempting to retrieve specified namespace information."
// @router /kubernetes/{id}/namespaces/{namespace} [get]
func (handler *Handler) getKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespaceName, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesNamespace").Msg("Invalid namespace parameter namespace")
		return httperror.BadRequest("an error occurred during the GetKubernetesNamespace operation, invalid namespace parameter namespace. Error: ", err)
	}

	withResourceQuota, err := request.RetrieveBooleanQueryParameter(r, "withResourceQuota", true)
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesNamespace").Msg("Invalid query parameter withResourceQuota")
		return httperror.BadRequest("an error occurred during the GetKubernetesNamespace operation for the namespace %s, invalid query parameter withResourceQuota. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetKubernetesNamespace").Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("an error occurred during the GetKubernetesNamespace operation for the namespace %s, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	namespaceInfo, err := cli.GetNamespace(namespaceName)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "GetKubernetesNamespace").Msg("Unable to find the namespace")
			return httperror.NotFound(fmt.Sprintf("an error occurred during the GetKubernetesNamespace operation for the namespace %s, unable to find the namespace. Error: ", namespaceName), err)
		}

		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "GetKubernetesNamespace").Msg("Unauthorized to access the namespace")
			return httperror.Forbidden(fmt.Sprintf("an error occurred during the GetKubernetesNamespace operation, unauthorized to access the namespace: %s. Error: ", namespaceName), err)
		}

		log.Error().Err(err).Str("context", "GetKubernetesNamespace").Msg("Unable to get the namespace")
		return httperror.InternalServerError(fmt.Sprintf("an error occurred during the GetKubernetesNamespace operation, unable to get the namespace: %s. Error: ", namespaceName), err)
	}

	if withResourceQuota {
		return cli.CombineNamespaceWithResourceQuota(namespaceInfo, w)
	}

	return response.JSON(w, namespaceInfo)
}

// @id CreateKubernetesNamespace
// @summary Create a namespace
// @description Create a namespace within the given environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param body body models.K8sNamespaceDetails true "Namespace configuration details"
// @success 200 {object} portainer.K8sNamespaceInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 409 "Conflict - the namespace already exists."
// @failure 500 "Server error occurred while attempting to create the namespace."
// @router /kubernetes/{id}/namespaces [post]
func (handler *Handler) createKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := models.K8sNamespaceDetails{}
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		log.Error().Err(err).Str("context", "CreateKubernetesNamespace").Msg("Invalid request payload")
		return httperror.BadRequest("an error occurred during the CreateKubernetesNamespace operation, invalid request payload. Error: ", err)
	}

	namespaceName := payload.Name
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "CreateKubernetesNamespace").Str("namespace", namespaceName).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("an error occurred during the CreateKubernetesNamespace operation for the namespace %s, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	namespace, err := cli.CreateNamespace(payload)
	if err != nil {
		if k8serrors.IsAlreadyExists(err) {
			log.Error().Err(err).Str("context", "CreateKubernetesNamespace").Str("namespace", namespaceName).Msg("The namespace already exists")
			return httperror.Conflict(fmt.Sprintf("an error occurred during the CreateKubernetesNamespace operation, the namespace %s already exists. Error: ", namespaceName), err)
		}

		log.Error().Err(err).Str("context", "CreateKubernetesNamespace").Str("namespace", namespaceName).Msg("Unable to create the namespace")
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
// @success 200 {string} string "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to delete the namespace."
// @router /kubernetes/{id}/namespaces [delete]
func (handler *Handler) deleteKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespaceNames, err := request.GetPayload[deleteKubernetesNamespacePayload](r)
	if err != nil {
		log.Error().Err(err).Str("context", "DeleteKubernetesNamespace").Msg("Invalid namespace identifier route variable")
		return httperror.BadRequest("an error occurred during the DeleteKubernetesNamespace operation, invalid namespace identifier route variable. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "DeleteKubernetesNamespace").Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("an error occurred during the DeleteKubernetesNamespace operation for the namespace %s, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	for _, namespaceName := range *namespaceNames {
		_, err := cli.DeleteNamespace(namespaceName)
		if err != nil {
			if k8serrors.IsNotFound(err) {
				log.Error().Err(err).Str("context", "DeleteKubernetesNamespace").Str("namespace", namespaceName).Msg("Unable to find the namespace")
				return httperror.NotFound(fmt.Sprintf("an error occurred during the DeleteKubernetesNamespace operation for the namespace %s, unable to find the namespace. Error: ", namespaceName), err)
			}

			log.Error().Err(err).Str("context", "DeleteKubernetesNamespace").Str("namespace", namespaceName).Msg("Unable to delete the namespace")
			return httperror.InternalServerError(fmt.Sprintf("an error occurred during the DeleteKubernetesNamespace operation for the namespace %s, unable to delete the Kubernetes namespace. Error: ", namespaceName), err)
		}
	}

	return response.JSON(w, namespaceNames)
}

type deleteKubernetesNamespacePayload []string

func (payload deleteKubernetesNamespacePayload) Validate(r *http.Request) error {
	if len(payload) == 0 {
		return errors.New("namespace names are required")
	}

	return nil
}

// @id UpdateKubernetesNamespace
// @summary Update a namespace
// @description Update a namespace within the given environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace"
// @param body body models.K8sNamespaceDetails true "Namespace details"
// @success 200 {object} portainer.K8sNamespaceInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find a specific namespace."
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
