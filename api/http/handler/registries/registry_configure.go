package registries

import (
	"errors"
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

type registryConfigurePayload struct {
	// Is authentication against this registry enabled
	Authentication bool `example:"false" validate:"required"`
	// Username used to authenticate against this registry. Required when Authentication is true
	Username string `example:"registry_user"`
	// Password used to authenticate against this registry. required when Authentication is true
	Password string `example:"registry_password"`
	// ECR region
	Region string
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

		region, _ := request.RetrieveMultiPartFormValue(r, "Region", true)
		payload.Region = region
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
// @description **Access policy**: restricted
// @tags registries
// @security ApiKeyAuth
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
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}
	if !securityContext.IsAdmin {
		return httperror.Forbidden("Permission denied to configure registry", httperrors.ErrResourceAccessDenied)
	}

	payload := &registryConfigurePayload{}
	err = payload.Validate(r)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	registryID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid registry identifier route variable", err)
	}

	registry, err := handler.DataStore.Registry().Read(portainer.RegistryID(registryID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a registry with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a registry with the specified identifier inside the database", err)
	}

	if payload.Authentication {
		registry.Authentication = true

		registry.Username = payload.Username

		if payload.Password != "" {
			registry.Password = payload.Password
		}

		if payload.Region != "" {
			registry.Ecr.Region = payload.Region
		}
	}

	var tlsConfig portainer.TLSConfiguration
	if payload.TLS {
		tlsConfig = portainer.TLSConfiguration{
			TLS:           true,
			TLSSkipVerify: payload.TLSSkipVerify,
		}

		if !payload.TLSSkipVerify {
			folder := strconv.Itoa(int(registry.ID))

			certPath, err := handler.FileService.StoreRegistryManagementFileFromBytes(folder, "cert.pem", payload.TLSCertFile)
			if err != nil {
				return httperror.InternalServerError("Unable to persist TLS certificate file on disk", err)
			}
			tlsConfig.TLSCertPath = certPath

			keyPath, err := handler.FileService.StoreRegistryManagementFileFromBytes(folder, "key.pem", payload.TLSKeyFile)
			if err != nil {
				return httperror.InternalServerError("Unable to persist TLS key file on disk", err)
			}
			tlsConfig.TLSKeyPath = keyPath

			cacertPath, err := handler.FileService.StoreRegistryManagementFileFromBytes(folder, "ca.pem", payload.TLSCACertFile)
			if err != nil {
				return httperror.InternalServerError("Unable to persist TLS CA certificate file on disk", err)
			}
			tlsConfig.TLSCACertPath = cacertPath
		}
	}

	registry.ManagementConfiguration = syncConfig(registry)
	registry.ManagementConfiguration.TLSConfig = tlsConfig

	err = handler.DataStore.Registry().Update(registry.ID, registry)
	if err != nil {
		return httperror.InternalServerError("Unable to persist registry changes inside the database", err)
	}

	return response.Empty(w)
}
