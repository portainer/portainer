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
		configMapsWithApplications, err := cli.CombineConfigMapsWithApplications(configMaps)
		if err != nil {
			log.Error().Err(err).Str("context", "getAllKubernetesConfigMaps").Msg("Unable to combine configMaps with associated applications")
			return nil, httperror.InternalServerError("Unable to combine configMaps with associated applications", err)
		}

		return configMapsWithApplications, nil
	}

	return configMaps, nil
}
