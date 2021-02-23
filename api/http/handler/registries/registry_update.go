package registries

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
)

type registryUpdatePayload struct {
	// Name that will be used to identify this registry
	Name *string `validate:"required" example:"my-registry"`
	// URL or IP address of the Docker registry
	URL *string `validate:"required" example:"registry.mydomain.tld:2375"`
	// Is authentication against this registry enabled
	Authentication *bool `example:"false" validate:"required"`
	// Username used to authenticate against this registry. Required when Authentication is true
	Username *string `example:"registry_user"`
	// Password used to authenticate against this registry. required when Authentication is true
	Password           *string `example:"registry_password"`
	UserAccessPolicies portainer.UserAccessPolicies
	TeamAccessPolicies portainer.TeamAccessPolicies
}

func (payload *registryUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// @id RegistryUpdate
// @summary Update a registry
// @description Update a registry
// @description **Access policy**: administrator
// @tags registries
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
	registryID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid registry identifier route variable", err}
	}

	var payload registryUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	registry, err := handler.DataStore.Registry().Registry(portainer.RegistryID(registryID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a registry with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a registry with the specified identifier inside the database", err}
	}

	if payload.Name != nil {
		registry.Name = *payload.Name
	}

	if payload.URL != nil {
		registries, err := handler.DataStore.Registry().Registries()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve registries from the database", err}
		}
		for _, r := range registries {
			if r.ID != registry.ID && hasSameURL(&r, registry) {
				return &httperror.HandlerError{http.StatusConflict, "Another registry with the same URL already exists", errors.New("A registry is already defined for this URL")}
			}
		}

		registry.URL = *payload.URL
	}

	if payload.Authentication != nil {
		if *payload.Authentication {
			registry.Authentication = true

			if payload.Username != nil {
				registry.Username = *payload.Username
			}

			if payload.Password != nil && *payload.Password != "" {
				registry.Password = *payload.Password
			}

		} else {
			registry.Authentication = false
			registry.Username = ""
			registry.Password = ""
		}
	}

	if payload.UserAccessPolicies != nil {
		registry.UserAccessPolicies = payload.UserAccessPolicies
	}

	if payload.TeamAccessPolicies != nil {
		registry.TeamAccessPolicies = payload.TeamAccessPolicies
	}

	err = handler.DataStore.Registry().UpdateRegistry(registry.ID, registry)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist registry changes inside the database", err}
	}

	return response.JSON(w, registry)
}

func hasSameURL(r1, r2 *portainer.Registry) bool {
	if r1.Type != portainer.GitlabRegistry || r2.Type != portainer.GitlabRegistry {
		return r1.URL == r2.URL
	}

	return r1.URL == r2.URL && r1.Gitlab.ProjectPath == r2.Gitlab.ProjectPath
}
