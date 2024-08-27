package kubernetes

import (
	"fmt"
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GetAllKubernetesVolumes
// @summary Get Kubernetes volumes within the given Portainer environment
// @description Get a list of all kubernetes volumes within the given environment (Endpoint). The Endpoint ID must be a valid Portainer environment identifier.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param withApplications query boolean false "When set to True, include the applications that are using the volumes. It is set to false by default"
// @success 200 {object} map[string]portainer.K8sVolumeInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve kubernetes volumes."
// @router /kubernetes/{id}/volumes [get]
func (handler *Handler) GetAllKubernetesVolumes(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	volumes, err := handler.getKubernetesVolumes(r)
	if err != nil {
		return err
	}

	return response.JSON(w, volumes)
}

// @id getAllKubernetesVolumesCount
// @summary Get the total number of kubernetes volumes within the given Portainer environment.
// @description Get the total number of kubernetes volumes within the given environment (Endpoint). The total count depends on the user's role and permissions. The Endpoint ID must be a valid Portainer environment identifier.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {integer} integer "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve kubernetes volumes count."
// @router /kubernetes/{id}/volumes/count [get]
func (handler *Handler) getAllKubernetesVolumesCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	volumes, err := handler.getKubernetesVolumes(r)
	if err != nil {
		return err
	}

	return response.JSON(w, len(volumes))
}

// @id GetKubernetesVolume
// @summary Get a Kubernetes volume within the given Portainer environment
// @description Get a Kubernetes volume within the given environment (Endpoint). The Endpoint ID must be a valid Portainer environment identifier.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
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

	volumeName, err := request.RetrieveRouteVariableValue(r, "volume")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesVolume operation, unable to retrieve volume name route variable. Error: ", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesVolume operation, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	volume, err := cli.GetVolume(namespace, volumeName)
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			return httperror.Unauthorized(fmt.Sprintf("an error occurred during the GetKubernetesVolume operation, unauthorized to access volume: %s in namespace: %s. Error: ", volumeName, namespace), err)
		}

		if k8serrors.IsNotFound(err) {
			return httperror.NotFound(fmt.Sprintf("an error occurred during the GetKubernetesVolume operation, unable to find volume: %s in namespace: %s. Error: ", volumeName, namespace), err)
		}

		return httperror.InternalServerError("an error occurred during the GetKubernetesVolume operation, unable to retrieve volume from the Kubernetes cluster. Error: ", err)
	}

	return response.JSON(w, volume)
}

func (handler *Handler) getKubernetesVolumes(r *http.Request) ([]models.K8sVolumeInfo, *httperror.HandlerError) {
	withApplications, err := request.RetrieveBooleanQueryParameter(r, "withApplications", true)
	if err != nil {
		return nil, httperror.BadRequest("an error occurred during the GetKubernetesVolumes operation, unable to parse query parameter. Error: ", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		return nil, httperror.InternalServerError("an error occurred during the GetKubernetesVolumes operation, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	volumes, err := cli.GetVolumes("")
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			return nil, httperror.Unauthorized("an error occurred during the GetKubernetesVolumes operation, unauthorized to access volumes in the Kubernetes cluster. Error: ", err)
		}

		return nil, httperror.InternalServerError("an error occurred during the GetKubernetesVolumes operation, unable to retrieve volumes from the Kubernetes cluster. Error: ", err)
	}

	if withApplications {
		volumesWithApplications, err := cli.CombineVolumesWithApplications(&volumes)
		if err != nil {
			return nil, httperror.InternalServerError("an error occurred during the GetKubernetesVolumes operation, unable to combine volumes with applications. Error: ", err)
		}

		return *volumesWithApplications, nil
	}

	return volumes, nil
}
