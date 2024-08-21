package kubernetes

import (
	"net/http"

	"github.com/portainer/portainer/api/http/middlewares"
	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GetKubernetesConfigMaps
// @summary Get ConfigMaps
// @description Get all ConfigMaps for a given namespace
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param isUsed query bool false "When set to true, associate the ConfigMaps with the applications that use them"
// @success 200 {array} []K8sConfigMap "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/configmaps [get]
func (handler *Handler) GetKubernetesConfigMaps(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	configMaps, err := handler.getKubernetesConfigMaps(r)
	if err != nil {
		return err
	}

	return response.JSON(w, configMaps)
}

// @id getKubernetesConfigMapsCount
// @summary Get ConfigMaps count
// @description Get the count of ConfigMaps for a given namespace
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {object} map[string]int "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/configmaps/count [get]
func (handler *Handler) getKubernetesConfigMapsCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	configMaps, err := handler.getKubernetesConfigMaps(r)
	if err != nil {
		return err
	}

	return response.JSON(w, len(configMaps))
}

func (handler *Handler) getKubernetesConfigMaps(r *http.Request) ([]models.K8sConfigMap, *httperror.HandlerError) {
	isUsed, err := request.RetrieveBooleanQueryParameter(r, "isUsed", false)
	if err != nil {
		return nil, httperror.BadRequest("an error occurred during the GetKubernetesConfigMaps operation, unable to retrieve isUsed query parameter. Error: ", err)
	}

	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return nil, httperror.NotFound("an error occurred during the GetKubernetesConfigMaps operation, unable to fetch endpoint. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return nil, httpErr
	}

	pcli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return nil, httperror.InternalServerError("an error occurred during the GetKubernetesConfigMaps operation, unable to get privileged kube client for combining services with applications. Error: ", err)
	}
	pcli.IsKubeAdmin = cli.IsKubeAdmin
	pcli.NonAdminNamespaces = cli.NonAdminNamespaces

	configMaps, err := cli.GetConfigMaps("")
	if err != nil {
		return nil, httperror.InternalServerError("an error occurred during the GetKubernetesConfigMaps operation, unable to get configMaps. Error: ", err)
	}

	if isUsed {
		configMapsWithApplications, err := pcli.CombineConfigMapsWithApplications(configMaps)
		if err != nil {
			return nil, httperror.InternalServerError("an error occurred during the GetKubernetesConfigMaps operation, unable to combine configMaps with applications. Error: ", err)
		}

		return configMapsWithApplications, nil
	}

	return configMaps, nil
}
