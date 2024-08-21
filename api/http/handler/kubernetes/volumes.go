package kubernetes

import (
	"net/http"

	"github.com/portainer/portainer/api/http/middlewares"
	models "github.com/portainer/portainer/api/http/models/kubernetes"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GetKubernetesVolumes
// @summary Get Kubernetes volumes within the given Portainer environment
// @description Get a list of all kubernetes volumes within the given environment (Endpoint). The Endpoint ID must be a valid Portainer environment identifier.
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param withApplications query boolean false "When set to True, include the applications that are using the volumes. It is set to false by default"
// @success 200 {object} map[string]portainer.K8sVolumeInfo "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/volumes [get]
func (handler *Handler) GetKubernetesVolumes(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	volumes, err := handler.getKubernetesVolumes(r)
	if err != nil {
		return err
	}

	return response.JSON(w, volumes)
}

// @id GetKubernetesVolumesCount
// @summary Get the total number of kubernetes volumes within the given Portainer environment.
// @description Get the total number of kubernetes volumes within the given environment (Endpoint). The total count depends on the user's role and permissions. The Endpoint ID must be a valid Portainer environment identifier.
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @success 200 {integer} integer "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/volumes/count [get]
func (handler *Handler) getKubernetesVolumesCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	volumes, err := handler.getKubernetesVolumes(r)
	if err != nil {
		return err
	}

	return response.JSON(w, len(volumes))
}

// @id GetKubernetesVolume
// @summary Get a Kubernetes volume within the given Portainer environment
// @description Get a Kubernetes volume within the given environment (Endpoint). The Endpoint ID must be a valid Portainer environment identifier.
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Namespace identifier"
// @param volume path string true "Volume name"
// @success 200 {object} portainer.K8sVolumeInfo "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/volumes/{namespace}/{volume} [get]
func (handler *Handler) getKubernetesVolume(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesVolume operation, unable to retrieve namespace identifier route variable. Error: ", err)
	}

	volume, err := request.RetrieveRouteVariableValue(r, "volume")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesVolume operation, unable to retrieve volume name route variable. Error: ", err)
	}

	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.NotFound("an error occurred during the GetKubernetesVolume operation, unable to fetch endpoint. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	pcli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesVolume operation, unable to get privileged kube client for combining services with applications. Error: ", err)
	}
	pcli.IsKubeAdmin = cli.IsKubeAdmin
	pcli.NonAdminNamespaces = cli.NonAdminNamespaces

	v, err := pcli.GetVolume(namespace, volume)
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesVolume operation, unable to retrieve volume from the Kubernetes cluster. Error: ", err)
	}

	return response.JSON(w, v)
}

func (handler *Handler) getKubernetesVolumes(r *http.Request) ([]models.K8sVolumeInfo, *httperror.HandlerError) {
	withApplications, err := request.RetrieveBooleanQueryParameter(r, "withApplications", true)
	if err != nil {
		return nil, httperror.BadRequest("an error occurred during the GetKubernetesVolumes operation, unable to parse query parameter. Error: ", err)
	}

	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return nil, httperror.NotFound("an error occurred during the GetKubernetesVolumes operation, unable to fetch endpoint. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return nil, httpErr
	}

	pcli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return nil, httperror.InternalServerError("an error occurred during the GetKubernetesVolumes operation, unable to get privileged kube client for combining services with applications. Error: ", err)
	}
	pcli.IsKubeAdmin = cli.IsKubeAdmin
	pcli.NonAdminNamespaces = cli.NonAdminNamespaces

	volumes, err := pcli.GetVolumes("")
	if err != nil {
		return nil, httperror.InternalServerError("an error occurred during the GetKubernetesVolumes operation, unable to retrieve volumes from the Kubernetes cluster. Error: ", err)
	}

	if withApplications {
		volumesWithApplications, err := pcli.CombineVolumesWithApplications(&volumes)
		if err != nil {
			return nil, httperror.InternalServerError("an error occurred during the GetKubernetesVolumes operation, unable to combine volumes with applications. Error: ", err)
		}

		return *volumesWithApplications, nil
	}

	return volumes, nil
}
