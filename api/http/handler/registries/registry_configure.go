package registries

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
)

type registryConfigurePayload struct {
	Authentication bool
	Username       string
	Password       string
	TLS            bool
	TLSSkipVerify  bool
	TLSCertFile    []byte
	TLSKeyFile     []byte
}

func (payload *registryConfigurePayload) Validate(r *http.Request) error {
	useAuthentication, _ := request.RetrieveBooleanMultiPartFormValue(r, "Authentication", true)
	payload.Authentication = useAuthentication

	if useAuthentication {
		username, err := request.RetrieveMultiPartFormValue(r, "Username", false)
		if err != nil {
			return portainer.Error("Invalid username")
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
			return portainer.Error("Invalid certificate file. Ensure that the file is uploaded correctly")
		}
		payload.TLSCertFile = cert

		key, _, err := request.RetrieveMultiPartFormFile(r, "TLSKeyFile")
		if err != nil {
			return portainer.Error("Invalid key file. Ensure that the file is uploaded correctly")
		}
		payload.TLSKeyFile = key
	}

	return nil
}

// POST request on /api/registries/:id/configure
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

	registry, err := handler.RegistryService.Registry(portainer.RegistryID(registryID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a registry with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a registry with the specified identifier inside the database", err}
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
			// TODO: store in /data/tls/registry_ID ? If so, registry_ prefix should probably be a constant
			// Or store somewhere else? /data/plugins/registrymanagement|1/registryid/
			folder := "registry_" + strconv.Itoa(int(registry.ID))

			certPath, err := handler.FileService.StoreTLSFileFromBytes(folder, portainer.TLSFileCert, payload.TLSCertFile)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist TLS certificate file on disk", err}
			}
			registry.ManagementConfiguration.TLSConfig.TLSCertPath = certPath

			keyPath, err := handler.FileService.StoreTLSFileFromBytes(folder, portainer.TLSFileKey, payload.TLSKeyFile)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist TLS key file on disk", err}
			}
			registry.ManagementConfiguration.TLSConfig.TLSKeyPath = keyPath
		}
	}

	err = handler.RegistryService.UpdateRegistry(registry.ID, registry)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist registry changes inside the database", err}
	}

	// TODO: Empty response? Or hide fields.
	return response.JSON(w, registry)
}
