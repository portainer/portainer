package registries

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
)

type registryCreatePayload struct {
	// Name that will be used to identify this registry
	Name string `example:"my-registry" validate:"required"`
	// Registry Type. Valid values are: 1 (Quay.io), 2 (Azure container registry), 3 (custom registry) or 4 (Gitlab registry)
	Type portainer.RegistryType `example:"1" validate:"required" enums:"1,2,3,4"`
	// URL or IP address of the Docker registry
	URL string `example:"registry.mydomain.tld:2375" validate:"required"`
	// Is authentication against this registry enabled
	Authentication bool `example:"false" validate:"required"`
	// Username used to authenticate against this registry. Required when Authentication is true
	Username string `example:"registry_user"`
	// Password used to authenticate against this registry. required when Authentication is true
	Password string `example:"registry_password"`
	// Gitlab specific details, required when type = 4
	Gitlab portainer.GitlabRegistryData
}

func (payload *registryCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("Invalid registry name")
	}
	if govalidator.IsNull(payload.URL) {
		return errors.New("Invalid registry URL")
	}
	if payload.Authentication && (govalidator.IsNull(payload.Username) || govalidator.IsNull(payload.Password)) {
		return errors.New("Invalid credentials. Username and password must be specified when authentication is enabled")
	}
	if payload.Type != portainer.QuayRegistry && payload.Type != portainer.AzureRegistry && payload.Type != portainer.CustomRegistry && payload.Type != portainer.GitlabRegistry {
		return errors.New("Invalid registry type. Valid values are: 1 (Quay.io), 2 (Azure container registry), 3 (custom registry) or 4 (Gitlab registry)")
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

	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: endpointId", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	registry := &portainer.Registry{
		Type:               portainer.RegistryType(payload.Type),
		Name:               payload.Name,
		URL:                payload.URL,
		Authentication:     payload.Authentication,
		Username:           payload.Username,
		Password:           payload.Password,
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		Gitlab:             payload.Gitlab,
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user info from request context", err}
	}

	canCreate, err := handler.userCanCreateRegistry(securityContext, portainer.EndpointID(endpointID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to verify user authorizations to validate Registry creation", err}
	}

	if !canCreate {
		errMsg := "Registry creation is disabled for non-admin users"
		return &httperror.HandlerError{http.StatusForbidden, errMsg, errors.New(errMsg)}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user details from authentication token", err}
	}

	err = handler.DataStore.Registry().CreateRegistry(registry)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the registry inside the database", err}
	}

	var resourceControl *portainer.ResourceControl

	isAdmin, err := handler.userIsAdmin(tokenData.ID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to load user information from the database", err}
	}

	if isAdmin {
		resourceControl = authorization.NewAdministratorsOnlyResourceControl(handler.computeRegistryResourceControlID(registry.ID, endpoint.ID), portainer.RegistryResourceControl)
	} else {
		resourceControl = authorization.NewPrivateResourceControl(handler.computeRegistryResourceControlID(registry.ID, endpoint.ID), portainer.RegistryResourceControl, tokenData.ID)
	}

	err = handler.DataStore.ResourceControl().CreateResourceControl(resourceControl)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist resource control inside the database", err}
	}

	hideFields(registry)
	return response.JSON(w, registry)
}
