package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"
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
// @success 200 {object} map[string]kubernetes.K8sVolumeInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve kubernetes volumes."
// @router /kubernetes/{id}/volumes [get]
func (handler *Handler) GetAllKubernetesVolumes(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	volumes, err := handler.getKubernetesVolumes(r, "")
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
	volumes, err := handler.getKubernetesVolumes(r, "")
	if err != nil {
		return err
	}

	return response.JSON(w, len(volumes))
}

// @id GetKubernetesVolumesInNamespace
// @summary Get Kubernetes volumes within a namespace in the given Portainer environment
// @description Get a list of kubernetes volumes within the specified namespace in the given environment (Endpoint). The Endpoint ID must be a valid Portainer environment identifier.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace identifier"
// @param withApplications query boolean false "When set to True, include the applications that are using the volumes. It is set to false by default"
// @success 200 {object} map[string]kubernetes.K8sVolumeInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve kubernetes volumes in the namespace."
// @router /kubernetes/{id}/namespaces/{namespace}/volumes [get]
func (handler *Handler) GetKubernetesVolumesInNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesVolumesInNamespace").Msg("Unable to retrieve namespace identifier")
		return httperror.BadRequest("Invalid namespace identifier", err)
	}

	volumes, httpErr := handler.getKubernetesVolumes(r, namespace)
	if httpErr != nil {
		return httpErr
	}

	return response.JSON(w, volumes)
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
// @success 200 {object} kubernetes.K8sVolumeInfo "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/volumes/{namespace}/{volume} [get]
func (handler *Handler) getKubernetesVolume(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesVolume").Msg("Unable to retrieve namespace identifier")
		return httperror.BadRequest("Invalid namespace identifier", err)
	}

	volumeName, err := request.RetrieveRouteVariableValue(r, "volume")
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesVolume").Msg("Unable to retrieve volume name")
		return httperror.BadRequest("Invalid volume name", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetKubernetesVolume").Msg("Unable to get Kubernetes client")
		return httperror.InternalServerError("Failed to prepare Kubernetes client", httpErr)
	}

	volume, err := cli.GetVolume(namespace, volumeName)
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			log.Error().Err(err).Str("context", "GetKubernetesVolume").Str("namespace", namespace).Str("volume", volumeName).Msg("Unauthorized access")
			return httperror.Unauthorized("Unauthorized access to volume", err)
		}

		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "GetKubernetesVolume").Str("namespace", namespace).Str("volume", volumeName).Msg("Volume not found")
			return httperror.NotFound("Volume not found", err)
		}

		log.Error().Err(err).Str("context", "GetKubernetesVolume").Str("namespace", namespace).Str("volume", volumeName).Msg("Failed to retrieve volume")
		return httperror.InternalServerError("Failed to retrieve volume", err)
	}

	return response.JSON(w, volume)
}

func (handler *Handler) getKubernetesVolumes(r *http.Request, namespace string) ([]models.K8sVolumeInfo, *httperror.HandlerError) {
	withApplications, err := request.RetrieveBooleanQueryParameter(r, "withApplications", true)
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesVolumes").Bool("withApplications", withApplications).Msg("Unable to parse query parameter")
		return nil, httperror.BadRequest("Invalid 'withApplications' parameter", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetKubernetesVolumes").Msg("Unable to get Kubernetes client")
		return nil, httperror.InternalServerError("Failed to prepare Kubernetes client", httpErr)
	}

	volumes, err := cli.GetVolumes(namespace)
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			log.Error().Err(err).Str("context", "GetKubernetesVolumes").Msg("Unauthorized access")
			return nil, httperror.Unauthorized("Unauthorized access to volumes", err)
		}

		log.Error().Err(err).Str("context", "GetKubernetesVolumes").Msg("Failed to retrieve volumes")
		return nil, httperror.InternalServerError("Failed to retrieve volumes", err)
	}

	if withApplications {
		volumesWithApplications, err := cli.CombineVolumesWithApplications(&volumes)
		if err != nil {
			log.Error().Err(err).Str("context", "GetKubernetesVolumes").Msg("Failed to combine volumes with applications")
			return nil, httperror.InternalServerError("Failed to combine volumes with applications", err)
		}

		return *volumesWithApplications, nil
	}

	return volumes, nil
}
