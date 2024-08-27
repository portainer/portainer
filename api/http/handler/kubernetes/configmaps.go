package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// @id getKubernetesConfigMap
// @summary Get ConfigMap
// @description Get a ConfigMap by name for a given namespace
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "The namespace name where the configmap is located"
// @param configmap path string true "The configmap name to get details for"
// @success 200 {object} models.K8sConfigMap "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve a configmap by name belong in a namespace."
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
		if k8serrors.IsUnauthorized(err) {
			return httperror.Unauthorized("an error occurred during the GetKubernetesConfigMap operation, unable to get configMap. Error: ", err)
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
// @summary Get ConfigMaps
// @description Get all ConfigMaps for a given namespace
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param isUsed query bool true "When set to true, associate the ConfigMaps with the applications that use them"
// @success 200 {array} models.[]K8sConfigMap "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve all configmaps from the cluster."
// @router /kubernetes/{id}/configmaps [get]
func (handler *Handler) GetAllKubernetesConfigMaps(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	configMaps, err := handler.getAllKubernetesConfigMaps(r)
	if err != nil {
		return err
	}

	return response.JSON(w, configMaps)
}

// @id getAllKubernetesConfigMapsCount
// @summary Get ConfigMaps count
// @description Get the count of ConfigMaps for a given namespace
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {integer} integer "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
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
		if k8serrors.IsUnauthorized(err) {
			return nil, httperror.Unauthorized("an error occurred during the GetAllKubernetesConfigMaps operation, unable to get configMap. Error: ", err)
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
