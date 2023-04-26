package kubernetes

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	models "github.com/portainer/portainer/api/http/models/kubernetes"
)

// @id getKubernetesNamespaces
// @summary Gets a list of kubernetes namespaces
// @description Gets a list of all kubernetes namespaces in the cluster
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @success 200 {object} map[string]portaineree.K8sNamespaceInfo "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces [get]
func (handler *Handler) getKubernetesNamespaces(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	cli, ok := handler.KubernetesClientFactory.GetProxyKubeClient(
		strconv.Itoa(endpointID), r.Header.Get("Authorization"),
	)
	if !ok {
		return httperror.InternalServerError(
			"Failed to lookup KubeClient",
			nil,
		)
	}

	namespaces, err := cli.GetNamespaces()
	if err != nil {
		return httperror.InternalServerError(
			"Unable to retrieve namespaces",
			err,
		)
	}

	return response.JSON(w, namespaces)
}

// @id getKubernetesNamespace
// @summary Gets details a specific kubernetes namespace
// @description Gets details for a specific kubernetes namespace for the given environment
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Environment (Endpoint) identifier"
// @success 200 {object} portaineree.K8sNamespaceInfo "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace} [get]
func (handler *Handler) getKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	cli, ok := handler.KubernetesClientFactory.GetProxyKubeClient(
		strconv.Itoa(endpointID), r.Header.Get("Authorization"),
	)
	if !ok {
		return httperror.InternalServerError(
			"Failed to lookup KubeClient",
			nil,
		)
	}

	ns, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}
	namespace, err := cli.GetNamespace(ns)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to retrieve namespace",
			err,
		)
	}

	return response.JSON(w, namespace)
}

// @id createKubernetesNamespace
// @summary Create a kubernetes namespace
// @description Creates a kubernetes namespace within the given environment
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Environment (Endpoint) identifier"
// @param body body models.K8sNamespaceDetails true "Namespace configuration details"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace} [post]
func (handler *Handler) createKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	cli, ok := handler.KubernetesClientFactory.GetProxyKubeClient(
		strconv.Itoa(endpointID), r.Header.Get("Authorization"),
	)
	if !ok {
		return httperror.InternalServerError(
			"Failed to lookup KubeClient",
			nil,
		)
	}

	var payload models.K8sNamespaceDetails
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest(
			"Invalid request payload",
			err,
		)
	}

	err = cli.CreateNamespace(payload)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to create namespace",
			err,
		)
	}
	return nil
}

// @id deleteKubernetesNamespaces
// @summary Delete kubernetes namespace
// @description Deletes a kubernetes namespace within the given environment
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Environment (Endpoint) identifier"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace} [delete]
func (handler *Handler) deleteKubernetesNamespaces(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	cli, ok := handler.KubernetesClientFactory.GetProxyKubeClient(
		strconv.Itoa(endpointID), r.Header.Get("Authorization"),
	)
	if !ok {
		return httperror.InternalServerError(
			"Failed to lookup KubeClient",
			nil,
		)
	}

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}

	err = cli.DeleteNamespace(namespace)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to delete namespace",
			err,
		)
	}

	return nil
}

// @id updateKubernetesNamespace
// @summary Delete kubernetes namespace
// @description Deletes a kubernetes namespace within the given environment
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Environment (Endpoint) identifier"
// @param body body models.K8sNamespaceDetails true "Namespace details"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace} [put]
func (handler *Handler) updateKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}

	cli, ok := handler.KubernetesClientFactory.GetProxyKubeClient(
		strconv.Itoa(endpointID), r.Header.Get("Authorization"),
	)
	if !ok {
		return httperror.InternalServerError(
			"Failed to lookup KubeClient",
			nil,
		)
	}

	var payload models.K8sNamespaceDetails
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	err = cli.UpdateNamespace(payload)
	if err != nil {
		return httperror.InternalServerError("Unable to update namespace", err)
	}
	return nil
}
