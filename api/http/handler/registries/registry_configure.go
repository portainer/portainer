package registries

import (
	"errors"
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
)

type registryConfigurePayload struct {
	// Is authentication against this registry enabled
	Authentication bool `example:"false" validate:"required"`
	// Username used to authenticate against this registry. Required when Authentication is true
	Username string `example:"registry_user"`
	// Password used to authenticate against this registry. required when Authentication is true
	Password string `example:"registry_password"`

	// Use TLS
	TLS bool `example:"true"`
	// Skip the verification of the server TLS certificate
	TLSSkipVerify bool `example:"false"`
	// The TLS CA certificate file
	TLSCACertFile []byte
	// The TLS client certificate file
	TLSCertFile []byte
	// The TLS client key file
	TLSKeyFile []byte
}

func (payload *registryConfigurePayload) Validate(r *http.Request) error {
	useAuthentication, _ := request.RetrieveBooleanMultiPartFormValue(r, "Authentication", true)
	payload.Authentication = useAuthentication

	if useAuthentication {
		username, err := request.RetrieveMultiPartFormValue(r, "Username", false)
		if err != nil {
			return errors.New("Invalid username")
		}
		payload.Username = username

		password, _ := request.RetrieveMultiPartFormValue(r, "Password", true)
		payload.Password = password
	}

	useTLS, _ := request.RetrieveBooleanMultiPartFormValue(r, "TLS", true)
	payload.TLS = useTLS

	skipTLSVerify, _ := request.RetrieveBooleanMultiPartFormValue(r, "TLSSkipVerify", true)
	payload.TLSSkipVerify = skipTLSVerify

	if useTLS && !skipTLSVerify {
		cert, _, err := request.RetrieveMultiPartFormFile(r, "TLSCertFile")
		if err != nil {
			return errors.New("Invalid certificate file. Ensure that the file is uploaded correctly")
		}
		payload.TLSCertFile = cert

		key, _, err := request.RetrieveMultiPartFormFile(r, "TLSKeyFile")
		if err != nil {
			return errors.New("Invalid key file. Ensure that the file is uploaded correctly")
		}
		payload.TLSKeyFile = key

		ca, _, err := request.RetrieveMultiPartFormFile(r, "TLSCACertFile")
		if err != nil {
			return errors.New("Invalid CA certificate file. Ensure that the file is uploaded correctly")
		}
		payload.TLSCACertFile = ca
	}

	return nil
}

// @id RegistryConfigure
// @summary Configures a registry
// @description Configures a registry.
// @description **Access policy**: admin
// @tags registries
// @security jwt
// @accept json
// @produce json
// @param id path int true "Registry identifier"
// @param body body registryConfigurePayload true "Registry configuration"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Registry not found"
// @failure 500 "Server error"
// @router /registries/{id}/configure [post]
func (handler *Handler) registryConfigure(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	registryID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid registry identifier route variable", err}
	}

	payload := &registryConfigurePayload{}
	err = payload.Validate(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	registry, err := handler.DataStore.Registry().Registry(portainer.RegistryID(registryID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a registry with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a registry with the specified identifier inside the database", err}
	}

	registry.ManagementConfiguration = &portainer.RegistryManagementConfiguration{
		Type: registry.Type,
	}

	if payload.Authentication {
		registry.ManagementConfiguration.Authentication = true
		registry.ManagementConfiguration.Username = payload.Username
		if payload.Username == registry.Username && payload.Password == "" {
			registry.ManagementConfiguration.Password = registry.Password
		} else {
			registry.ManagementConfiguration.Password = payload.Password
		}
	}

	if payload.TLS {
		registry.ManagementConfiguration.TLSConfig = portainer.TLSConfiguration{
			TLS:           true,
			TLSSkipVerify: payload.TLSSkipVerify,
		}

		if !payload.TLSSkipVerify {
			folder := strconv.Itoa(int(registry.ID))

			certPath, err := handler.FileService.StoreRegistryManagementFileFromBytes(folder, "cert.pem", payload.TLSCertFile)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist TLS certificate file on disk", err}
			}
			registry.ManagementConfiguration.TLSConfig.TLSCertPath = certPath

			keyPath, err := handler.FileService.StoreRegistryManagementFileFromBytes(folder, "key.pem", payload.TLSKeyFile)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist TLS key file on disk", err}
			}
			registry.ManagementConfiguration.TLSConfig.TLSKeyPath = keyPath

			cacertPath, err := handler.FileService.StoreRegistryManagementFileFromBytes(folder, "ca.pem", payload.TLSCACertFile)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist TLS CA certificate file on disk", err}
			}
			registry.ManagementConfiguration.TLSConfig.TLSCACertPath = cacertPath
		}
	}

	err = handler.DataStore.Registry().UpdateRegistry(registry.ID, registry)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist registry changes inside the database", err}
	}

	return response.Empty(w)
}
