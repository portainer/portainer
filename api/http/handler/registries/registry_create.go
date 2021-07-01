package registries

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type registryCreatePayload struct {
	// Name that will be used to identify this registry
	Name string `example:"my-registry" validate:"required"`
	// Registry Type. Valid values are: 1 (Quay.io), 2 (Azure container registry), 3 (custom registry), 4 (Gitlab registry) or 5 (ProGet registry)
	Type portainer.RegistryType `example:"1" validate:"required" enums:"1,2,3,4,5"`
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
}

func (payload *registryCreatePayload) Validate(_ *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("Invalid registry name")
	}
	if govalidator.IsNull(payload.URL) {
		return errors.New("Invalid registry URL")
	}
	if payload.Authentication && (govalidator.IsNull(payload.Username) || govalidator.IsNull(payload.Password)) {
		return errors.New("Invalid credentials. Username and password must be specified when authentication is enabled")
	}

	switch payload.Type {
	case portainer.QuayRegistry, portainer.AzureRegistry, portainer.CustomRegistry, portainer.GitlabRegistry, portainer.ProGetRegistry:
	default:
		return errors.New("invalid registry type. Valid values are: 1 (Quay.io), 2 (Azure container registry), 3 (custom registry), 4 (Gitlab registry) or 5 (ProGet registry)")
	}

	if payload.Type == portainer.ProGetRegistry && payload.BaseURL == "" {
		return fmt.Errorf("BaseURL is required for registry type %d (ProGet)", portainer.ProGetRegistry)
	}

	return nil
}

// @id RegistryCreate
// @summary Create a new registry
// @description Create a new registry.
// @description **Access policy**: administrator
// @tags registries
// @security jwt
// @accept json
// @produce json
// @param body body registryCreatePayload true "Registry details"
// @success 200 {object} portainer.Registry "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /registries [post]
func (handler *Handler) registryCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload registryCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	registry := &portainer.Registry{
		Type:               portainer.RegistryType(payload.Type),
		Name:               payload.Name,
		URL:                payload.URL,
		BaseURL:            payload.BaseURL,
		Authentication:     payload.Authentication,
		Username:           payload.Username,
		Password:           payload.Password,
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		Gitlab:             payload.Gitlab,
		Quay:               payload.Quay,
	}

	err = handler.DataStore.Registry().CreateRegistry(registry)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the registry inside the database", err}
	}

	hideFields(registry)
	return response.JSON(w, registry)
}
