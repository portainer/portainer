package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id getKubernetesNamespaces
// @summary Get a list of kubernetes namespaces
// @description Get a list of all kubernetes namespaces in the cluster
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @success 200 {object} map[string]portainer.K8sNamespaceInfo "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces [get]
func (handler *Handler) getKubernetesNamespaces(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	namespaces, err := cli.GetNamespaces()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve namespaces", err)
	}

	return response.JSON(w, namespaces)
}

// @id getKubernetesNamespace
// @summary Get kubernetes namespace details
// @description Get kubernetes namespace details for the provided namespace within the given environment
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Namespace"
// @success 200 {object} portainer.K8sNamespaceInfo "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace} [get]
func (handler *Handler) getKubernetesNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	ns, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	namespace, err := cli.GetNamespace(ns)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve namespace", err)
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
