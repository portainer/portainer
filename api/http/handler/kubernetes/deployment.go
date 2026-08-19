package kubernetes

import (
	"errors"
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	kcli "github.com/portainer/portainer/api/kubernetes/cli"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
	appsv1 "k8s.io/api/apps/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// KubernetesDeploymentResponse is the documented response model for the deployment
// read endpoint. It is a deployment trimmed of server-managed and heavy fields
// (managed fields, status, last-applied-config annotation).
type KubernetesDeploymentResponse appsv1.Deployment

// KubernetesDeploymentListResponse is the documented response model for the deployment
// list endpoints. It mirrors the Kubernetes list shape ({items: [...]}).
type KubernetesDeploymentListResponse appsv1.DeploymentList

// @id getAllKubernetesDeployments
// @summary Get Kubernetes deployments
// @description Get the list of Kubernetes deployments across all namespaces the user can access.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param labelSelector query string false "Kubernetes label selector to filter the deployments"
// @param fieldSelector query string false "Kubernetes field selector to filter the deployments"
// @success 200 {object} KubernetesDeploymentListResponse "Success"
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 500 "Server error occurred while attempting to retrieve the deployments."
// @router /kubernetes/{id}/deployments [get]
func (handler *Handler) getAllKubernetesDeployments(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	return handler.getKubernetesDeploymentsForNamespaceValue(w, r, "")
}

// @id getKubernetesDeploymentsForNamespace
// @summary Get Kubernetes deployments within a namespace
// @description Get the list of Kubernetes deployments in the given namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param labelSelector query string false "Kubernetes label selector to filter the deployments"
// @param fieldSelector query string false "Kubernetes field selector to filter the deployments"
// @success 200 {object} KubernetesDeploymentListResponse "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 500 "Server error occurred while attempting to retrieve the deployments within the specified namespace."
// @router /kubernetes/{id}/namespaces/{namespace}/deployments [get]
func (handler *Handler) getKubernetesDeploymentsForNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesDeploymentsForNamespace").Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("Unable to retrieve namespace identifier route variable", err)
	}

	return handler.getKubernetesDeploymentsForNamespaceValue(w, r, namespace)
}

// getKubernetesDeploymentsForNamespaceValue backs both the cluster-wide and the
// namespaced deployment list endpoints (namespace is empty for cluster-wide).
func (handler *Handler) getKubernetesDeploymentsForNamespaceValue(w http.ResponseWriter, r *http.Request, namespace string) *httperror.HandlerError {
	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getKubernetesDeployments").Str("namespace", namespace).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	deployments, err := cli.GetDeployments(namespace, parseK8sListOptions(r))
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesDeployments").Str("namespace", namespace).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesDeployments").Str("namespace", namespace).Msg("Unable to retrieve deployments")
		return httperror.InternalServerError("Unable to retrieve deployments", err)
	}

	// Return the Kubernetes list shape ({items: [...]}) so it mirrors the raw API.
	return response.JSON(w, appsv1.DeploymentList{Items: deployments})
}

// @id getKubernetesDeployment
// @summary Get a Kubernetes deployment
// @description Get a Kubernetes deployment in the given namespace. The response is
// @description trimmed of server-managed and heavy fields (managed fields,
// @description last-applied-config annotation) while preserving the full pod template,
// @description spec and resourceVersion so an edit form can be reconstructed from the
// @description live cluster and the workload subsequently updated.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param name path string true "Deployment name"
// @success 200 {object} KubernetesDeploymentResponse "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 500 "Server error occurred while attempting to retrieve the deployment."
// @router /kubernetes/{id}/namespaces/{namespace}/deployments/{name} [get]
func (handler *Handler) getKubernetesDeployment(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesDeployment").Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("Unable to retrieve namespace identifier route variable", err)
	}

	name, err := request.RetrieveRouteVariableValue(r, "name")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesDeployment").Msg("Unable to retrieve deployment name route variable")
		return httperror.BadRequest("Unable to retrieve deployment name route variable", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getKubernetesDeployment").Str("namespace", namespace).Str("name", name).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	deployment, err := cli.GetDeployment(namespace, name)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesDeployment").Str("namespace", namespace).Str("name", name).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "getKubernetesDeployment").Str("namespace", namespace).Str("name", name).Msg("Unable to retrieve deployment")
			return httperror.NotFound("Unable to retrieve deployment", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesDeployment").Str("namespace", namespace).Str("name", name).Msg("Unable to retrieve deployment")
		return httperror.InternalServerError("Unable to retrieve deployment", err)
	}

	return response.JSON(w, deployment)
}

// @id CreateKubernetesDeployment
// @summary Create a Kubernetes deployment
// @description Create a deployment in the given namespace. The namespace comes from the
// @description route, and the payload models the fields the deployment forms drive.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param body body models.K8sDeploymentWriteRequest true "Deployment definition"
// @success 200 {object} KubernetesDeploymentResponse "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 409 "A deployment with the same name already exists in the namespace."
// @failure 500 "Server error occurred while attempting to create the deployment."
// @router /kubernetes/{id}/namespaces/{namespace}/deployments [post]
func (handler *Handler) createKubernetesDeployment(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "createKubernetesDeployment").Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("Unable to retrieve namespace identifier route variable", err)
	}

	var payload models.K8sDeploymentWriteRequest
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		log.Error().Err(err).Str("context", "createKubernetesDeployment").Str("namespace", namespace).Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("Unable to decode and validate the request payload", err)
	}

	if err := payload.ValidateForCreate(); err != nil {
		log.Error().Err(err).Str("context", "createKubernetesDeployment").Str("namespace", namespace).Str("name", payload.Name).Msg("Unable to validate the request payload")
		return httperror.BadRequest("Unable to validate the request payload", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "createKubernetesDeployment").Str("namespace", namespace).Str("name", payload.Name).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	deployment, err := cli.CreateDeployment(namespace, payload)
	if err != nil {
		return writeErrorResponse(err, "createKubernetesDeployment", namespace, payload.Name, "create the deployment")
	}

	return response.JSON(w, deployment)
}

// @id UpdateKubernetesDeployment
// @summary Update a Kubernetes deployment
// @description Update a deployment in the given namespace. The payload is merged onto the
// @description live deployment: fields it does not model, such as the update strategy or
// @description the pod affinity rules, are preserved, and a field left out leaves the live
// @description value untouched. The selector is immutable and is ignored.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param name path string true "Deployment name"
// @param body body models.K8sDeploymentWriteRequest true "Deployment definition"
// @success 200 {object} KubernetesDeploymentResponse "Success"
// @failure 400 "Invalid request payload, such as missing required fields, fields not meeting validation criteria, or a payload name that does not match the route."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find the deployment to update."
// @failure 409 "The deployment was modified concurrently."
// @failure 500 "Server error occurred while attempting to update the deployment."
// @router /kubernetes/{id}/namespaces/{namespace}/deployments/{name} [put]
func (handler *Handler) updateKubernetesDeployment(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, name, httpErr := parseNamespaceAndDeploymentName(r, "updateKubernetesDeployment")
	if httpErr != nil {
		return httpErr
	}

	var payload models.K8sDeploymentWriteRequest
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesDeployment").Str("namespace", namespace).Str("name", name).Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("Unable to decode and validate the request payload", err)
	}

	if payload.Name != name {
		log.Error().Str("context", "updateKubernetesDeployment").Str("namespace", namespace).Str("name", name).Str("payload_name", payload.Name).Msg("The payload name does not match the route")
		return httperror.BadRequest("The deployment name in the request payload does not match the one in the route", nil)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "updateKubernetesDeployment").Str("namespace", namespace).Str("name", name).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	deployment, err := cli.UpdateDeployment(namespace, payload)
	if err != nil {
		return writeErrorResponse(err, "updateKubernetesDeployment", namespace, name, "update the deployment")
	}

	return response.JSON(w, deployment)
}

// @id ScaleKubernetesDeployment
// @summary Scale a Kubernetes deployment
// @description Set the desired replica count of a deployment in the given namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param name path string true "Deployment name"
// @param body body models.K8sDeploymentScaleRequest true "Desired replica count"
// @success 200 {object} KubernetesDeploymentResponse "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find the deployment to scale."
// @failure 500 "Server error occurred while attempting to scale the deployment."
// @router /kubernetes/{id}/namespaces/{namespace}/deployments/{name}/scale [put]
func (handler *Handler) scaleKubernetesDeployment(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, name, httpErr := parseNamespaceAndDeploymentName(r, "scaleKubernetesDeployment")
	if httpErr != nil {
		return httpErr
	}

	var payload models.K8sDeploymentScaleRequest
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		log.Error().Err(err).Str("context", "scaleKubernetesDeployment").Str("namespace", namespace).Str("name", name).Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("Unable to decode and validate the request payload", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "scaleKubernetesDeployment").Str("namespace", namespace).Str("name", name).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	deployment, err := cli.ScaleDeployment(namespace, name, *payload.Replicas)
	if err != nil {
		return writeErrorResponse(err, "scaleKubernetesDeployment", namespace, name, "scale the deployment")
	}

	return response.JSON(w, deployment)
}

// @id PatchKubernetesDeployment
// @summary Annotate a Kubernetes deployment
// @description Add or overwrite annotations on a deployment and on the pods it creates.
// @description Annotations the payload does not name are kept. Changing a pod annotation
// @description rolls the workload, which is how a rollout restart is triggered.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param name path string true "Deployment name"
// @param body body models.K8sDeploymentPatchRequest true "Annotations to apply"
// @success 200 {object} KubernetesDeploymentResponse "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find the deployment to annotate."
// @failure 500 "Server error occurred while attempting to annotate the deployment."
// @router /kubernetes/{id}/namespaces/{namespace}/deployments/{name} [patch]
func (handler *Handler) patchKubernetesDeployment(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, name, httpErr := parseNamespaceAndDeploymentName(r, "patchKubernetesDeployment")
	if httpErr != nil {
		return httpErr
	}

	var payload models.K8sDeploymentPatchRequest
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		log.Error().Err(err).Str("context", "patchKubernetesDeployment").Str("namespace", namespace).Str("name", name).Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("Unable to decode and validate the request payload", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "patchKubernetesDeployment").Str("namespace", namespace).Str("name", name).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	deployment, err := cli.PatchDeployment(namespace, name, payload)
	if err != nil {
		return writeErrorResponse(err, "patchKubernetesDeployment", namespace, name, "annotate the deployment")
	}

	return response.JSON(w, deployment)
}

// @id RollbackKubernetesDeployment
// @summary Roll a Kubernetes deployment back
// @description Roll a deployment back to an earlier revision by replaying the pod template
// @description the corresponding replica set recorded. A revision of 0, or an omitted one,
// @description selects the revision immediately before the current.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param name path string true "Deployment name"
// @param body body models.K8sDeploymentRollbackRequest true "Revision to roll back to"
// @success 200 {object} KubernetesDeploymentResponse "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find the deployment, or the requested revision is not part of its rollout history."
// @failure 500 "Server error occurred while attempting to roll the deployment back."
// @router /kubernetes/{id}/namespaces/{namespace}/deployments/{name}/rollback [post]
func (handler *Handler) rollbackKubernetesDeployment(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, name, httpErr := parseNamespaceAndDeploymentName(r, "rollbackKubernetesDeployment")
	if httpErr != nil {
		return httpErr
	}

	var payload models.K8sDeploymentRollbackRequest
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		log.Error().Err(err).Str("context", "rollbackKubernetesDeployment").Str("namespace", namespace).Str("name", name).Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("Unable to decode and validate the request payload", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "rollbackKubernetesDeployment").Str("namespace", namespace).Str("name", name).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	deployment, err := cli.RolloutUndo(namespace, name, payload.Revision)
	if err != nil {
		// A rollout target that is not there is a missing resource rather than a cluster
		// failure, and the Kubernetes API never sees the request in that case.
		if errors.Is(err, kcli.ErrRevisionNotFound) || errors.Is(err, kcli.ErrNoRolloutHistory) {
			log.Error().Err(err).Str("context", "rollbackKubernetesDeployment").Str("namespace", namespace).Str("name", name).Int64("revision", payload.Revision).Msg("Unable to find a revision to roll back to")
			return httperror.NotFound("Unable to find a revision to roll back to", err)
		}

		return writeErrorResponse(err, "rollbackKubernetesDeployment", namespace, name, "roll the deployment back")
	}

	return response.JSON(w, deployment)
}

// @id DeleteKubernetesDeployment
// @summary Delete a Kubernetes deployment
// @description Delete a deployment in the given namespace. The replica sets and pods it
// @description owns are garbage collected by the cluster.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param name path string true "Deployment name"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find the deployment to delete."
// @failure 500 "Server error occurred while attempting to delete the deployment."
// @router /kubernetes/{id}/namespaces/{namespace}/deployments/{name} [delete]
func (handler *Handler) deleteKubernetesDeployment(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, name, httpErr := parseNamespaceAndDeploymentName(r, "deleteKubernetesDeployment")
	if httpErr != nil {
		return httpErr
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "deleteKubernetesDeployment").Str("namespace", namespace).Str("name", name).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	if err := cli.DeleteDeployment(namespace, name); err != nil {
		return writeErrorResponse(err, "deleteKubernetesDeployment", namespace, name, "delete the deployment")
	}

	return response.Empty(w)
}

// parseNamespaceAndDeploymentName reads the namespace and deployment name the write
// endpoints share from the request route.
func parseNamespaceAndDeploymentName(r *http.Request, logContext string) (string, string, *httperror.HandlerError) {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", logContext).Msg("Unable to retrieve namespace identifier route variable")
		return "", "", httperror.BadRequest("Unable to retrieve namespace identifier route variable", err)
	}

	name, err := request.RetrieveRouteVariableValue(r, "name")
	if err != nil {
		log.Error().Err(err).Str("context", logContext).Str("namespace", namespace).Msg("Unable to retrieve deployment name route variable")
		return "", "", httperror.BadRequest("Unable to retrieve deployment name route variable", err)
	}

	return namespace, name, nil
}
