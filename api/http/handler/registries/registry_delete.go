package registries

import (
	"fmt"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/registryutils"
	"github.com/portainer/portainer/api/pendingactions/handlers"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/rs/zerolog/log"
)

// cleanupRegistryFromNamespaces removes the registry imagePullSecret from the
// default service account and deletes the registry secret in each namespace.
// It returns the list of namespaces that failed either operation so the caller
// can schedule a pending action for retry.
func cleanupRegistryFromNamespaces(cli portainer.KubeClient, registryID portainer.RegistryID, namespaces []string, endpointID portainer.EndpointID) []string {
	secretName := registryutils.RegistrySecretName(registryID)
	failed := make([]string, 0)

	for _, ns := range namespaces {
		if err := cli.RemoveImagePullSecretFromServiceAccount(ns, "default", secretName); err != nil {
			failed = append(failed, ns)
			log.Warn().Err(err).Msgf("Unable to remove registry secret from default service account in namespace %q for environment %d. Retrying offline", ns, endpointID)
			continue
		}

		if err := cli.DeleteRegistrySecret(registryID, ns); err != nil {
			failed = append(failed, ns)
			log.Warn().Err(err).Msgf("Unable to delete registry secret %q from namespace %q for environment %d. Retrying offline", secretName, ns, endpointID)
		}
	}

	return failed
}

// @id RegistryDelete
// @summary Remove a registry
// @description Remove a registry
// @description **Access policy**: restricted
// @tags registries
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Registry identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 404 "Registry not found"
// @failure 500 "Server error"
// @router /registries/{id} [delete]
func (handler *Handler) registryDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	} else if !securityContext.IsAdmin {
		return httperror.Forbidden("Permission denied to delete registry", httperrors.ErrResourceAccessDenied)
	}

	registryID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid registry identifier route variable", err)
	}

	registry, err := handler.DataStore.Registry().Read(portainer.RegistryID(registryID))
	if err != nil {
		return httperror.InternalServerError(fmt.Sprintf("Unable to load registry %q from the database", registry.Name), err)
	}

	if err := handler.DataStore.Registry().Delete(portainer.RegistryID(registryID)); err != nil {
		return httperror.InternalServerError("Unable to remove the registry from the database", err)
	}

	handler.deleteKubernetesSecrets(handler.DataStore, registry)

	return response.Empty(w)
}

func (handler *Handler) deleteKubernetesSecrets(tx dataservices.DataStoreTx, registry *portainer.Registry) {
	for endpointId, access := range registry.RegistryAccesses {
		if access.Namespaces == nil {
			continue
		}

		// Obtain a kubeclient for the endpoint
		endpoint, err := tx.Endpoint().Endpoint(endpointId)
		if err != nil {
			// Skip environments that can't be loaded from the DB
			log.Warn().Err(err).Msgf("Unable to load the environment with id %d from the database", endpointId)

			continue
		}

		cli, err := handler.K8sClientFactory.GetPrivilegedKubeClient(endpoint)
		if err != nil {
			// Skip environments that can't get a kubeclient from
			log.Warn().Err(err).Msgf("Unable to get kubernetes client for environment %d", endpointId)

			continue
		}

		failedNamespaces := cleanupRegistryFromNamespaces(cli, registry.ID, access.Namespaces, endpointId)

		if len(failedNamespaces) == 0 {
			continue
		}

		if err := handler.PendingActionsService.Create(
			tx,
			handlers.NewDeleteK8sRegistrySecrets(endpointId, registry.ID, failedNamespaces),
		); err != nil {
			log.Warn().Err(err).Msg("unable to schedule pending action to delete kubernetes registry secrets")
		}
	}
}
