package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// @id GetKubernetesConfigMap
// @summary Get a ConfigMap
// @description Get a ConfigMap by name for a given namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "The namespace name where the configmap is located"
// @param configmap path string true "The configmap name to get details for"
// @success 200 {object} models.K8sConfigMap "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or a configmap with the specified name in the given namespace."
// @failure 500 "Server error occurred while attempting to retrieve a configmap by name within the specified namespace."
// @router /kubernetes/{id}/namespaces/{namespace}/configmaps/{configmap} [get]
func (handler *Handler) getKubernetesConfigMap(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesConfigMap").Str("namespace", namespace).Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("Unable to retrieve namespace identifier route variable", err)
	}

	configMapName, err := request.RetrieveRouteVariableValue(r, "configmap")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesConfigMap").Str("namespace", namespace).Msg("Unable to retrieve configMap identifier route variable")
		return httperror.BadRequest("Unable to retrieve configMap identifier route variable", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getKubernetesConfigMap").Str("namespace", namespace).Str("configMap", configMapName).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	configMap, err := cli.GetConfigMap(namespace, configMapName)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesConfigMap").Str("namespace", namespace).Str("configMap", configMapName).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "getKubernetesConfigMap").Str("namespace", namespace).Str("configMap", configMapName).Msg("Unable to retrieve configMap")
			return httperror.NotFound("Unable to retrieve configMap", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesConfigMap").Str("namespace", namespace).Str("configMap", configMapName).Msg("Unable to retrieve configMap")
		return httperror.InternalServerError("Unable to retrieve configMap", err)
	}

	configMapWithApplications, err := cli.CombineConfigMapWithApplications(configMap)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesConfigMap").Str("namespace", namespace).Str("configMap", configMapName).Msg("Unable to combine configMap with applications")
		return httperror.InternalServerError("Unable to combine configMap with applications", err)
	}

	return response.JSON(w, configMapWithApplications)
}

// @id GetAllKubernetesConfigMaps
// @summary Get a list of ConfigMaps
// @description Get a list of ConfigMaps across all namespaces in the cluster. For non-admin users, it will only return ConfigMaps based on the namespaces that they have access to.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param isUsed query bool true "Set to true to include information about applications that use the ConfigMaps in the response"
// @success 200 {array} models.K8sConfigMap "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve all configmaps from the cluster."
// @router /kubernetes/{id}/configmaps [get]
func (handler *Handler) GetAllKubernetesConfigMaps(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	configMaps, err := handler.getAllKubernetesConfigMaps(r)
	if err != nil {
		return err
	}

	return response.JSON(w, configMaps)
}

// @id GetAllKubernetesConfigMapsCount
// @summary Get ConfigMaps count
// @description Get the count of ConfigMaps across all namespaces in the cluster. For non-admin users, it will only return the count of ConfigMaps based on the namespaces that they have access to.
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
// @failure 500 "Server error occurred while attempting to retrieve the count of all configmaps from the cluster."
// @router /kubernetes/{id}/configmaps/count [get]
func (handler *Handler) getAllKubernetesConfigMapsCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	configMaps, err := handler.getAllKubernetesConfigMaps(r)
	if err != nil {
		return err
	}

	return response.JSON(w, len(configMaps))
}

// @id CreateKubernetesConfigMap
// @summary Create a ConfigMap
// @description Create a ConfigMap in the given namespace. The response carries the
// @description created ConfigMap's metadata only, not its data.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "The namespace name where the configmap is created"
// @param body body models.K8sConfigMapWriteRequest true "ConfigMap definition"
// @success 200 {object} models.K8sConfigMap "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 409 "A configmap with the same name already exists in the namespace."
// @failure 500 "Server error occurred while attempting to create the configmap."
// @router /kubernetes/{id}/namespaces/{namespace}/configmaps [post]
func (handler *Handler) createKubernetesConfigMap(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "createKubernetesConfigMap").Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("Unable to retrieve namespace identifier route variable", err)
	}

	var payload models.K8sConfigMapWriteRequest
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		log.Error().Err(err).Str("context", "createKubernetesConfigMap").Str("namespace", namespace).Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("Unable to decode and validate the request payload", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "createKubernetesConfigMap").Str("namespace", namespace).Str("configmap", payload.Name).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	configMap, err := cli.CreateConfigMap(namespace, payload)
	if err != nil {
		return writeErrorResponse(err, "createKubernetesConfigMap", namespace, payload.Name, "create the config map")
	}

	return response.JSON(w, configMap)
}

// @id UpdateKubernetesConfigMap
// @summary Update a ConfigMap
// @description Update a ConfigMap in the given namespace. A nil field leaves the live
// @description value untouched, so an empty map clears it, and binary data is preserved.
// @description The response carries the updated ConfigMap's metadata only.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "The namespace name where the configmap is located"
// @param configmap path string true "The configmap name to update"
// @param body body models.K8sConfigMapWriteRequest true "ConfigMap definition"
// @success 200 {object} models.K8sConfigMap "Success"
// @failure 400 "Invalid request payload, such as missing required fields, fields not meeting validation criteria, or a payload name that does not match the route."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find the configmap to update."
// @failure 500 "Server error occurred while attempting to update the configmap."
// @router /kubernetes/{id}/namespaces/{namespace}/configmaps/{configmap} [put]
func (handler *Handler) updateKubernetesConfigMap(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesConfigMap").Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("Unable to retrieve namespace identifier route variable", err)
	}

	configMapName, err := request.RetrieveRouteVariableValue(r, "configmap")
	if err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesConfigMap").Str("namespace", namespace).Msg("Unable to retrieve configmap identifier route variable")
		return httperror.BadRequest("Unable to retrieve configmap identifier route variable", err)
	}

	var payload models.K8sConfigMapWriteRequest
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		log.Error().Err(err).Str("context", "updateKubernetesConfigMap").Str("namespace", namespace).Str("configmap", configMapName).Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("Unable to decode and validate the request payload", err)
	}

	if payload.Name != configMapName {
		log.Error().Str("context", "updateKubernetesConfigMap").Str("namespace", namespace).Str("configmap", configMapName).Str("payload_name", payload.Name).Msg("The payload name does not match the route")
		return httperror.BadRequest("The config map name in the request payload does not match the one in the route", nil)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "updateKubernetesConfigMap").Str("namespace", namespace).Str("configmap", configMapName).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	configMap, err := cli.UpdateConfigMap(namespace, payload)
	if err != nil {
		return writeErrorResponse(err, "updateKubernetesConfigMap", namespace, configMapName, "update the config map")
	}

	return response.JSON(w, configMap)
}

// @id DeleteKubernetesConfigMap
// @summary Delete a ConfigMap
// @description Delete a ConfigMap in the given namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "The namespace name where the configmap is located"
// @param configmap path string true "The configmap name to delete"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find the configmap to delete."
// @failure 500 "Server error occurred while attempting to delete the configmap."
// @router /kubernetes/{id}/namespaces/{namespace}/configmaps/{configmap} [delete]
func (handler *Handler) deleteKubernetesConfigMap(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "deleteKubernetesConfigMap").Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("Unable to retrieve namespace identifier route variable", err)
	}

	configMapName, err := request.RetrieveRouteVariableValue(r, "configmap")
	if err != nil {
		log.Error().Err(err).Str("context", "deleteKubernetesConfigMap").Str("namespace", namespace).Msg("Unable to retrieve configmap identifier route variable")
		return httperror.BadRequest("Unable to retrieve configmap identifier route variable", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "deleteKubernetesConfigMap").Str("namespace", namespace).Str("configmap", configMapName).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	if err := cli.DeleteConfigMap(namespace, configMapName); err != nil {
		return writeErrorResponse(err, "deleteKubernetesConfigMap", namespace, configMapName, "delete the config map")
	}

	return response.Empty(w)
}

func (handler *Handler) getAllKubernetesConfigMaps(r *http.Request) ([]models.K8sConfigMap, *httperror.HandlerError) {
	isUsed, err := request.RetrieveBooleanQueryParameter(r, "isUsed", true)
	if err != nil {
		log.Error().Err(err).Str("context", "getAllKubernetesConfigMaps").Msg("Unable to retrieve isUsed query parameter")
		return nil, httperror.BadRequest("Unable to retrieve isUsed query parameter", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getAllKubernetesConfigMaps").Msg("Unable to prepare kube client")
		return nil, httperror.InternalServerError("Unable to prepare kube client", httpErr)
	}

	configMaps, err := cli.GetConfigMaps("")
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getAllKubernetesConfigMaps").Msg("Unauthorized access to the Kubernetes API")
			return nil, httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		log.Error().Err(err).Str("context", "getAllKubernetesConfigMaps").Msg("Unable to get configMaps")
		return nil, httperror.InternalServerError("Unable to get configMaps", err)
	}

	if isUsed {
		err = cli.SetConfigMapsIsUsed(&configMaps)
		if err != nil {
			log.Error().Err(err).Str("context", "getAllKubernetesConfigMaps").Msg("Unable to combine configMaps with associated applications")
			return nil, httperror.InternalServerError("Unable to combine configMaps with associated applications", err)
		}
	}

	return configMaps, nil
}
