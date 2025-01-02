package registries

import (
	"fmt"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/pendingactions/handlers"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/rs/zerolog/log"
)

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

	handler.deleteKubernetesSecrets(registry)

	return response.Empty(w)
}

func (handler *Handler) deleteKubernetesSecrets(registry *portainer.Registry) {
	for endpointId, access := range registry.RegistryAccesses {
		if access.Namespaces != nil {
			// Obtain a kubeclient for the endpoint
			endpoint, err := handler.DataStore.Endpoint().Endpoint(endpointId)
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

			failedNamespaces := make([]string, 0)

			for _, ns := range access.Namespaces {
				if err := cli.DeleteRegistrySecret(registry.ID, ns); err != nil {
					failedNamespaces = append(failedNamespaces, ns)
					log.Warn().Err(err).Msgf("Unable to delete registry secret %q from namespace %q for environment %d. Retrying offline", cli.RegistrySecretName(registry.ID), ns, endpointId)
				}
			}

			if len(failedNamespaces) > 0 {
				handler.PendingActionsService.Create(
					handlers.NewDeleteK8sRegistrySecrets(endpointId, registry.ID, failedNamespaces),
				)
			}
		}
	}
}
