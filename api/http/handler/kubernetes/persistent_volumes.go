package kubernetes

import (
	"errors"
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	kcli "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GetAllKubernetesPersistentVolumes
// @summary Get all PersistentVolumes in the cluster
// @description Get a list of all PersistentVolumes in the given environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} models.K8sPersistentVolume "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve persistent volumes."
// @router /kubernetes/{id}/persistent_volumes [get]
func (handler *Handler) getAllKubernetesPersistentVolumes(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetAllKubernetesPersistentVolumes").Msg("Unable to get Kubernetes client")
		return httpErr
	}

	pvs, err := cli.GetPersistentVolumes()
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			return httperror.Forbidden("unauthorized access to persistent volumes", err)
		}

		log.Error().Err(err).Str("context", "GetAllKubernetesPersistentVolumes").Msg("Failed to retrieve persistent volumes")
		return httperror.InternalServerError("failed to retrieve persistent volumes", err)
	}

	return response.JSON(w, pvs)
}

// @id GetKubernetesPersistentVolume
// @summary Get a specific PersistentVolume
// @description Get a PersistentVolume by name in the given environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param name path string true "PersistentVolume name"
// @success 200 {object} models.K8sPersistentVolume "Success"
// @failure 400 "Invalid request payload."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 404 "PersistentVolume not found."
// @failure 500 "Server error occurred while attempting to retrieve the persistent volume."
// @router /kubernetes/{id}/persistent_volumes/{name} [get]
func (handler *Handler) getKubernetesPersistentVolume(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	name, err := request.RetrieveRouteVariableValue(r, "name")
	if err != nil {
		return httperror.BadRequest("invalid persistent volume name", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetKubernetesPersistentVolume").Msg("Unable to get Kubernetes client")
		return httpErr
	}

	pv, err := cli.GetPersistentVolume(name)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			return httperror.NotFound("persistent volume not found", err)
		}

		if errors.Is(err, kcli.ErrUnauthorized) || k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			return httperror.Forbidden("unauthorized access to the Kubernetes API", err)
		}

		log.Error().Err(err).Str("context", "GetKubernetesPersistentVolume").Str("name", name).Msg("Failed to retrieve persistent volume")
		return httperror.InternalServerError("failed to retrieve persistent volume", err)
	}

	return response.JSON(w, pv)
}

// @id DeleteKubernetesPersistentVolumes
// @summary Delete PersistentVolumes
// @description Delete the provided list of PersistentVolumes.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param body body models.K8sPVDeleteRequest true "List of PV names to delete"
// @success 204 "Success"
// @failure 400 "Invalid request payload."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to delete persistent volumes."
// @router /kubernetes/{id}/persistent_volumes/delete [post]
func (handler *Handler) deleteKubernetesPersistentVolumes(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload models.K8sPVDeleteRequest
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("unable to decode and validate the request payload", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	err = cli.DeletePersistentVolumes(payload)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			return httperror.Forbidden("unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsNotFound(err) {
			return httperror.NotFound("unable to find the persistent volumes to delete", err)
		}

		log.Error().Err(err).Str("context", "DeleteKubernetesPersistentVolumes").Msg("Unable to delete persistent volumes")
		return httperror.InternalServerError("unable to delete persistent volumes", err)
	}

	return response.Empty(w)
}

// @id UpdateKubernetesPersistentVolumeReclaimPolicy
// @summary Update reclaim policy of a PersistentVolume
// @description Update the reclaim policy of a PersistentVolume.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param body body models.K8sPVReclaimPolicyRequest true "Reclaim policy update request"
// @success 204 "Success"
// @failure 400 "Invalid request payload."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to update reclaim policy."
// @router /kubernetes/{id}/persistent_volumes/reclaim_policy [put]
func (handler *Handler) updateKubernetesPVReclaimPolicy(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload models.K8sPVReclaimPolicyRequest
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("unable to decode and validate the request payload", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	err = cli.UpdatePersistentVolumeReclaimPolicy(payload.Name, payload.ReclaimPolicy)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			return httperror.Forbidden("unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsNotFound(err) {
			return httperror.NotFound("persistent volume not found", err)
		}

		log.Error().Err(err).Str("context", "UpdateKubernetesPVReclaimPolicy").Str("name", payload.Name).Msg("Unable to update reclaim policy")
		return httperror.InternalServerError("unable to update reclaim policy", err)
	}

	return response.Empty(w)
}
