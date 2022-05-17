package registries

import (
	"errors"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

type registryUpdatePayload struct {
	// Name that will be used to identify this registry
	Name *string `validate:"required" example:"my-registry"`
	// URL or IP address of the Docker registry
	URL *string `validate:"required" example:"registry.mydomain.tld:2375"`
	// BaseURL is used for quay registry
	BaseURL *string `json:",omitempty" example:"registry.mydomain.tld:2375"`
	// Is authentication against this registry enabled
	Authentication *bool `example:"false" validate:"required"`
	// Username used to authenticate against this registry. Required when Authentication is true
	Username *string `example:"registry_user"`
	// Password used to authenticate against this registry. required when Authentication is true
	Password *string `example:"registry_password"`
	// Quay data
	Quay *portainer.QuayRegistryData
	// Registry access control
	RegistryAccesses *portainer.RegistryAccesses `json:",omitempty"`
	// ECR data
	Ecr *portainer.EcrData `json:",omitempty"`
}

func (payload *registryUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// @id RegistryUpdate
// @summary Update a registry
// @description Update a registry
// @description **Access policy**: restricted
// @tags registries
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Registry identifier"
// @param body body registryUpdatePayload true "Registry details"
// @success 200 {object} portainer.Registry "Success"
// @failure 400 "Invalid request"
// @failure 404 "Registry not found"
// @failure 409 "Another registry with the same URL already exists"
// @failure 500 "Server error"
// @router /registries/{id} [put]
func (handler *Handler) registryUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if !securityContext.IsAdmin {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to update registry", httperrors.ErrResourceAccessDenied}
	}

	registryID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid registry identifier route variable", err}
	}

	registry, err := handler.DataStore.Registry().Registry(portainer.RegistryID(registryID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a registry with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a registry with the specified identifier inside the database", err}
	}

	registries, err := handler.DataStore.Registry().Registries()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve registries from the database", err}
	}

	var payload registryUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	if payload.Name != nil {
		registry.Name = *payload.Name
	}
	// enforce name uniqueness across registries
	// check is performed even if Name didn't change (Name not in payload) as we need
	// to enforce this rule on updates not performed with frontend (e.g. on direct API requests)
	// see https://portainer.atlassian.net/browse/EE-2706 for more details
	for _, r := range registries {
		if r.ID != registry.ID && r.Name == registry.Name {
			return &httperror.HandlerError{http.StatusConflict, "Another registry with the same name already exists", errors.New("A registry is already defined with this name")}
		}
	}

	if registry.Type == portainer.ProGetRegistry && payload.BaseURL != nil {
		registry.BaseURL = *payload.BaseURL
	}

	shouldUpdateSecrets := false

	if payload.Authentication != nil {
		shouldUpdateSecrets = shouldUpdateSecrets || (registry.Authentication != *payload.Authentication)

		if *payload.Authentication {
			registry.Authentication = true

			if payload.Username != nil {
				shouldUpdateSecrets = shouldUpdateSecrets || (registry.Username != *payload.Username)
				registry.Username = *payload.Username
			}

			if payload.Password != nil && *payload.Password != "" {
				shouldUpdateSecrets = shouldUpdateSecrets || (registry.Password != *payload.Password)
				registry.Password = *payload.Password
			}

			if registry.Type == portainer.EcrRegistry && payload.Ecr != nil && payload.Ecr.Region != "" {
				shouldUpdateSecrets = shouldUpdateSecrets || (registry.Ecr.Region != payload.Ecr.Region)
				registry.Ecr.Region = payload.Ecr.Region
			}
		} else {
			registry.Authentication = false
			registry.Username = ""
			registry.Password = ""

			registry.Ecr.Region = ""

			registry.AccessToken = ""
			registry.AccessTokenExpiry = 0
		}
	}

	if payload.URL != nil {
		shouldUpdateSecrets = shouldUpdateSecrets || (*payload.URL != registry.URL)

		registry.URL = *payload.URL

		for _, r := range registries {
			if r.ID != registry.ID && handler.registriesHaveSameURLAndCredentials(&r, registry) {
				return &httperror.HandlerError{http.StatusConflict, "Another registry with the same URL and credentials already exists", errors.New("A registry is already defined for this URL and credentials")}
			}
		}
	}

	if shouldUpdateSecrets {
		registry.AccessToken = ""
		registry.AccessTokenExpiry = 0

		for endpointID, endpointAccess := range registry.RegistryAccesses {
			endpoint, err := handler.DataStore.Endpoint().Endpoint(endpointID)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update access to registry", err}
			}

			if endpointutils.IsKubernetesEndpoint(endpoint) {
				err = handler.updateEndpointRegistryAccess(endpoint, registry, endpointAccess)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update access to registry", err}
				}
			}
		}
	}

	if payload.Quay != nil {
		registry.Quay = *payload.Quay
	}

	err = handler.DataStore.Registry().UpdateRegistry(registry.ID, registry)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist registry changes inside the database", err}
	}

	return response.JSON(w, registry)
}

func (handler *Handler) updateEndpointRegistryAccess(endpoint *portainer.Endpoint, registry *portainer.Registry, endpointAccess portainer.RegistryAccessPolicies) error {

	cli, err := handler.K8sClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return err
	}

	for _, namespace := range endpointAccess.Namespaces {
		err := cli.DeleteRegistrySecret(registry, namespace)
		if err != nil {
			return err
		}

		err = cli.CreateRegistrySecret(registry, namespace)
		if err != nil {
			return err
		}
	}

	return nil
}
