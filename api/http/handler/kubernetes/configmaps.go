package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
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
		return httperror.BadRequest("an error occurred during the GetKubernetesConfigMap operation, unable to retrieve namespace identifier route variable. Error: ", err)
	}

	configMapName, err := request.RetrieveRouteVariableValue(r, "configmap")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesConfigMap operation, unable to retrieve configMap identifier route variable. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	configMap, err := cli.GetConfigMap(namespace, configMapName)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			return httperror.Forbidden("an error occurred during the GetKubernetesConfigMap operation, unable to get configMap. Error: ", err)
		}

		if k8serrors.IsNotFound(err) {
			return httperror.NotFound("an error occurred during the GetKubernetesConfigMap operation, unable to get configMap. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the GetKubernetesConfigMap operation, unable to get configMap. Error: ", err)
	}

	configMapWithApplications, err := cli.CombineConfigMapWithApplications(configMap)
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesConfigMap operation, unable to combine configMap with applications. Error: ", err)
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
		return nil, httperror.BadRequest("an error occurred during the GetAllKubernetesConfigMaps operation, unable to retrieve isUsed query parameter. Error: ", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		return nil, httperror.InternalServerError("an error occurred during the GetAllKubernetesConfigMaps operation, unable to prepare kube client. Error: ", httpErr)
	}

	configMaps, err := cli.GetConfigMaps("")
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			return nil, httperror.Forbidden("an error occurred during the GetAllKubernetesConfigMaps operation, unable to get configMap. Error: ", err)
		}

		return nil, httperror.InternalServerError("an error occurred during the GetAllKubernetesConfigMaps operation, unable to get configMaps. Error: ", err)
	}

	if isUsed {
		configMapsWithApplications, err := cli.CombineConfigMapsWithApplications(configMaps)
		if err != nil {
			return nil, httperror.InternalServerError("an error occurred during the GetAllKubernetesConfigMaps operation, unable to combine configMaps with applications. Error: ", err)
		}

		return configMapsWithApplications, nil
	}

	return configMaps, nil
}
