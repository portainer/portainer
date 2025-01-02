package registries

import (
	"errors"
	"fmt"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type registryCreatePayload struct {
	// Name that will be used to identify this registry
	Name string `example:"my-registry" validate:"required"`
	// Registry Type. Valid values are:
	//	1 (Quay.io),
	//	2 (Azure container registry),
	//	3 (custom registry),
	//	4 (Gitlab registry),
	//	5 (ProGet registry),
	//	6 (DockerHub)
	//	7 (ECR)
	Type portainer.RegistryType `example:"1" validate:"required" enums:"1,2,3,4,5,6,7"`
	// URL or IP address of the Docker registry
	URL string `example:"registry.mydomain.tld:2375/feed" validate:"required"`
	// BaseURL required for ProGet registry
	BaseURL string `example:"registry.mydomain.tld:2375"`
	// Is authentication against this registry enabled
	Authentication bool `example:"false" validate:"required"`
	// Username used to authenticate against this registry. Required when Authentication is true
	Username string `example:"registry_user"`
	// Password used to authenticate against this registry. required when Authentication is true
	Password string `example:"registry_password"`
	// Gitlab specific details, required when type = 4
	Gitlab portainer.GitlabRegistryData
	// Quay specific details, required when type = 1
	Quay portainer.QuayRegistryData
	// ECR specific details, required when type = 7
	Ecr portainer.EcrData
}

func (payload *registryCreatePayload) Validate(_ *http.Request) error {
	if len(payload.Name) == 0 {
		return errors.New("invalid registry name")
	}
	if len(payload.URL) == 0 {
		return errors.New("invalid registry URL")
	}

	if payload.Authentication {
		if len(payload.Username) == 0 || len(payload.Password) == 0 {
			return errors.New("invalid credentials. Username and password must be specified when authentication is enabled")
		}
		if payload.Type == portainer.EcrRegistry {
			if len(payload.Ecr.Region) == 0 {
				return errors.New("invalid credentials: access key ID, secret access key and region must be specified when authentication is enabled")
			}
		}
	}

	switch payload.Type {
	case portainer.QuayRegistry, portainer.AzureRegistry, portainer.CustomRegistry, portainer.GitlabRegistry, portainer.ProGetRegistry, portainer.DockerHubRegistry, portainer.EcrRegistry:
	default:
		return errors.New("invalid registry type. Valid values are: 1 (Quay.io), 2 (Azure container registry), 3 (custom registry), 4 (Gitlab registry), 5 (ProGet registry), 6 (DockerHub), 7 (ECR)")
	}

	if payload.Type == portainer.ProGetRegistry && payload.BaseURL == "" {
		return fmt.Errorf("BaseURL is required for registry type %d (ProGet)", portainer.ProGetRegistry)
	}

	return nil
}

// @id RegistryCreate
// @summary Create a new registry
// @description Create a new registry.
// @description **Access policy**: restricted
// @tags registries
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body registryCreatePayload true "Registry details"
// @success 200 {object} portainer.Registry "Success"
// @failure 400 "Invalid request"
// @failure 409 "Another registry with the same name or same URL & credentials already exists"
// @failure 500 "Server error"
// @router /registries [post]
func (handler *Handler) registryCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}
	if !securityContext.IsAdmin {
		return httperror.Forbidden("Permission denied to create registry", httperrors.ErrResourceAccessDenied)
	}

	var payload registryCreatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	registry := &portainer.Registry{
		Type:             payload.Type,
		Name:             payload.Name,
		URL:              payload.URL,
		BaseURL:          payload.BaseURL,
		Authentication:   payload.Authentication,
		Username:         payload.Username,
		Password:         payload.Password,
		Gitlab:           payload.Gitlab,
		Quay:             payload.Quay,
		RegistryAccesses: portainer.RegistryAccesses{},
		Ecr:              payload.Ecr,
	}

	registry.ManagementConfiguration = syncConfig(registry)

	registries, err := handler.DataStore.Registry().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve registries from the database", err)
	}
	for _, r := range registries {
		if r.Name == registry.Name {
			return httperror.Conflict("Another registry with the same name already exists", errors.New("a registry is already defined with this name"))
		}
		if handler.registriesHaveSameURLAndCredentials(&r, registry) {
			return httperror.Conflict("Another registry with the same URL and credentials already exists", errors.New("a registry is already defined for this URL and credentials"))
		}
	}

	err = handler.DataStore.Registry().Create(registry)
	if err != nil {
		return httperror.InternalServerError("Unable to persist the registry inside the database", err)
	}

	hideFields(registry, true)
	return response.JSON(w, registry)
}
