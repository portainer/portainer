package endpoints

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/client"
)

type endpointUpdatePayload struct {
	Name                   string
	URL                    string
	PublicURL              string
	GroupID                int
	TLS                    bool
	TLSSkipVerify          bool
	TLSSkipClientVerify    bool
	Status                 int
	AzureApplicationID     string
	AzureTenantID          string
	AzureAuthenticationKey string
	Tags                   []string
}

func (payload *endpointUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/endpoints/:id
func (handler *Handler) endpointUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	if !handler.authorizeEndpointManagement {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Endpoint management is disabled", ErrEndpointManagementDisabled}
	}

	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	var payload endpointUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	if payload.Name != "" {
		endpoint.Name = payload.Name
	}

	if payload.URL != "" {
		endpoint.URL = payload.URL
	}

	if payload.PublicURL != "" {
		endpoint.PublicURL = payload.PublicURL
	}

	if payload.GroupID != 0 {
		endpoint.GroupID = portainer.EndpointGroupID(payload.GroupID)
	}

	if payload.Tags != nil {
		endpoint.Tags = payload.Tags
	}

	switch payload.Status {
	case 1:
		endpoint.Status = portainer.EndpointStatusUp
		break
	case 2:
		endpoint.Status = portainer.EndpointStatusDown
		break
	default:
		break
	}

	if endpoint.Type == portainer.AzureEnvironment {
		credentials := endpoint.AzureCredentials
		if payload.AzureApplicationID != "" {
			credentials.ApplicationID = payload.AzureApplicationID
		}
		if payload.AzureTenantID != "" {
			credentials.TenantID = payload.AzureTenantID
		}
		if payload.AzureAuthenticationKey != "" {
			credentials.AuthenticationKey = payload.AzureAuthenticationKey
		}

		httpClient := client.NewHTTPClient()
		_, authErr := httpClient.ExecuteAzureAuthenticationRequest(&credentials)
		if authErr != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to authenticate against Azure", authErr}
		}
		endpoint.AzureCredentials = credentials
	}

	folder := strconv.Itoa(endpointID)
	if payload.TLS {
		endpoint.TLSConfig.TLS = true
		endpoint.TLSConfig.TLSSkipVerify = payload.TLSSkipVerify
		if !payload.TLSSkipVerify {
			caCertPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileCA)
			endpoint.TLSConfig.TLSCACertPath = caCertPath
		} else {
			endpoint.TLSConfig.TLSCACertPath = ""
			handler.FileService.DeleteTLSFile(folder, portainer.TLSFileCA)
		}

		if !payload.TLSSkipClientVerify {
			certPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileCert)
			endpoint.TLSConfig.TLSCertPath = certPath
			keyPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileKey)
			endpoint.TLSConfig.TLSKeyPath = keyPath
		} else {
			endpoint.TLSConfig.TLSCertPath = ""
			handler.FileService.DeleteTLSFile(folder, portainer.TLSFileCert)
			endpoint.TLSConfig.TLSKeyPath = ""
			handler.FileService.DeleteTLSFile(folder, portainer.TLSFileKey)
		}
	} else {
		endpoint.TLSConfig.TLS = false
		endpoint.TLSConfig.TLSSkipVerify = false
		endpoint.TLSConfig.TLSCACertPath = ""
		endpoint.TLSConfig.TLSCertPath = ""
		endpoint.TLSConfig.TLSKeyPath = ""
		err = handler.FileService.DeleteTLSFiles(folder)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove TLS files from disk", err}
		}
	}

	_, err = handler.ProxyManager.CreateAndRegisterProxy(endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to register HTTP proxy for the endpoint", err}
	}

	err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint changes inside the database", err}
	}

	return response.JSON(w, endpoint)
}
