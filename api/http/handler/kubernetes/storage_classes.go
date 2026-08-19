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

// @id GetAllKubernetesStorageClasses
// @summary Get all StorageClasses
// @description Get a list of all StorageClasses in the given environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} models.K8sStorageClass "Success"
// @failure 400 "Invalid request payload."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve storage classes."
// @router /kubernetes/{id}/storage_classes [get]
func (handler *Handler) getAllKubernetesStorageClasses(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetAllKubernetesStorageClasses").Msg("Unable to get Kubernetes client")
		return httpErr
	}

	storageClasses, err := cli.GetStorageClasses()
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			return httperror.Forbidden("unauthorized access to storage classes", err)
		}

		log.Error().Err(err).Str("context", "GetAllKubernetesStorageClasses").Msg("Failed to retrieve storage classes")
		return httperror.InternalServerError("failed to retrieve storage classes", err)
	}

	return response.JSON(w, storageClasses)
}

// @id GetKubernetesStorageClass
// @summary Get a specific StorageClass
// @description Get a StorageClass by name in the given environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param name path string true "StorageClass name"
// @success 200 {object} models.K8sStorageClass "Success"
// @failure 400 "Invalid request payload."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 404 "StorageClass not found."
// @failure 500 "Server error occurred while attempting to retrieve the storage class."
// @router /kubernetes/{id}/storage_classes/{name} [get]
func (handler *Handler) getKubernetesStorageClass(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	name, err := request.RetrieveRouteVariableValue(r, "name")
	if err != nil {
		return httperror.BadRequest("invalid storage class name", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetKubernetesStorageClass").Msg("Unable to get Kubernetes client")
		return httpErr
	}

	sc, err := cli.GetStorageClass(name)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			return httperror.NotFound("storage class not found", err)
		}

		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			return httperror.Forbidden("unauthorized access to the Kubernetes API", err)
		}

		log.Error().Err(err).Str("context", "GetKubernetesStorageClass").Str("name", name).Msg("Failed to retrieve storage class")
		return httperror.InternalServerError("failed to retrieve storage class", err)
	}

	return response.JSON(w, sc)
}

// @id DeleteKubernetesStorageClasses
// @summary Delete StorageClasses
// @description Delete the provided list of StorageClasses.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param body body models.K8sStorageClassDeleteRequest true "List of StorageClass names to delete"
// @success 204 "Success"
// @failure 400 "Invalid request payload."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to delete storage classes."
// @router /kubernetes/{id}/storage_classes/delete [post]
func (handler *Handler) deleteKubernetesStorageClasses(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload models.K8sStorageClassDeleteRequest
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("unable to decode and validate the request payload", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	err = cli.DeleteStorageClasses(payload)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			return httperror.Forbidden("unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsNotFound(err) {
			return httperror.NotFound("unable to find the storage classes to delete", err)
		}

		log.Error().Err(err).Str("context", "DeleteKubernetesStorageClasses").Msg("Unable to delete storage classes")
		return httperror.InternalServerError("unable to delete storage classes", err)
	}

	return response.Empty(w)
}

// @id SetDefaultKubernetesStorageClass
// @summary Set a StorageClass as default
// @description Set the specified StorageClass as the cluster default, removing default from any other.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param name path string true "StorageClass name"
// @success 204 "Success"
// @failure 400 "Invalid request payload."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to set default storage class."
// @router /kubernetes/{id}/storage_classes/{name}/default [put]
func (handler *Handler) setDefaultKubernetesStorageClass(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	name, err := request.RetrieveRouteVariableValue(r, "name")
	if err != nil {
		return httperror.BadRequest("invalid storage class name", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	err = cli.SetDefaultStorageClass(name)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			return httperror.Forbidden("unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsNotFound(err) {
			return httperror.NotFound("storage class not found", err)
		}

		log.Error().Err(err).Str("context", "SetDefaultKubernetesStorageClass").Str("name", name).Msg("Unable to set default storage class")
		return httperror.InternalServerError("unable to set default storage class", err)
	}

	return response.Empty(w)
}
