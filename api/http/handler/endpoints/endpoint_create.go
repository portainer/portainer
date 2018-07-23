package endpoints

import (
	"log"
	"net/http"
	"runtime"
	"strconv"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/crypto"
	"github.com/portainer/portainer/http/client"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type endpointCreatePayload struct {
	Name                   string
	URL                    string
	EndpointType           int
	PublicURL              string
	GroupID                int
	TLS                    bool
	TLSSkipVerify          bool
	TLSSkipClientVerify    bool
	TLSCACertFile          []byte
	TLSCertFile            []byte
	TLSKeyFile             []byte
	AzureApplicationID     string
	AzureTenantID          string
	AzureAuthenticationKey string
	Tags                   []string
}

func (payload *endpointCreatePayload) Validate(r *http.Request) error {
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return portainer.Error("Invalid stack name")
	}
	payload.Name = name

	endpointType, err := request.RetrieveNumericMultiPartFormValue(r, "EndpointType", false)
	if err != nil || endpointType == 0 {
		return portainer.Error("Invalid endpoint type value. Value must be one of: 1 (Docker environment), 2 (Agent environment) or 3 (Azure environment)")
	}
	payload.EndpointType = endpointType

	groupID, _ := request.RetrieveNumericMultiPartFormValue(r, "GroupID", true)
	if groupID == 0 {
		groupID = 1
	}
	payload.GroupID = groupID

	var tags []string
	err = request.RetrieveMultiPartFormJSONValue(r, "Tags", &tags, true)
	if err != nil {
		return portainer.Error("Invalid Tags parameter")
	}
	payload.Tags = tags

	useTLS, _ := request.RetrieveBooleanMultiPartFormValue(r, "TLS", true)
	payload.TLS = useTLS

	if payload.TLS {
		skipTLSServerVerification, _ := request.RetrieveBooleanMultiPartFormValue(r, "TLSSkipVerify", true)
		payload.TLSSkipVerify = skipTLSServerVerification
		skipTLSClientVerification, _ := request.RetrieveBooleanMultiPartFormValue(r, "TLSSkipClientVerify", true)
		payload.TLSSkipClientVerify = skipTLSClientVerification

		if !payload.TLSSkipVerify {
			caCert, err := request.RetrieveMultiPartFormFile(r, "TLSCACertFile")
			if err != nil {
				return portainer.Error("Invalid CA certificate file. Ensure that the file is uploaded correctly")
			}
			payload.TLSCACertFile = caCert
		}

		if !payload.TLSSkipClientVerify {
			cert, err := request.RetrieveMultiPartFormFile(r, "TLSCertFile")
			if err != nil {
				return portainer.Error("Invalid certificate file. Ensure that the file is uploaded correctly")
			}
			payload.TLSCertFile = cert

			key, err := request.RetrieveMultiPartFormFile(r, "TLSKeyFile")
			if err != nil {
				return portainer.Error("Invalid key file. Ensure that the file is uploaded correctly")
			}
			payload.TLSKeyFile = key
		}
	}

	switch portainer.EndpointType(payload.EndpointType) {
	case portainer.AzureEnvironment:
		azureApplicationID, err := request.RetrieveMultiPartFormValue(r, "AzureApplicationID", false)
		if err != nil {
			return portainer.Error("Invalid Azure application ID")
		}
		payload.AzureApplicationID = azureApplicationID

		azureTenantID, err := request.RetrieveMultiPartFormValue(r, "AzureTenantID", false)
		if err != nil {
			return portainer.Error("Invalid Azure tenant ID")
		}
		payload.AzureTenantID = azureTenantID

		azureAuthenticationKey, err := request.RetrieveMultiPartFormValue(r, "AzureAuthenticationKey", false)
		if err != nil {
			return portainer.Error("Invalid Azure authentication key")
		}
		payload.AzureAuthenticationKey = azureAuthenticationKey
	default:
		url, err := request.RetrieveMultiPartFormValue(r, "URL", true)
		if err != nil {
			return portainer.Error("Invalid endpoint URL")
		}
		payload.URL = url

		publicURL, _ := request.RetrieveMultiPartFormValue(r, "PublicURL", true)
		payload.PublicURL = publicURL
	}

	return nil
}

// POST request on /api/endpoints
func (handler *Handler) endpointCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	if !handler.authorizeEndpointManagement {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Endpoint management is disabled", ErrEndpointManagementDisabled}
	}

	payload := &endpointCreatePayload{}
	err := payload.Validate(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	endpoint, endpointCreationError := handler.createEndpoint(payload)
	if endpointCreationError != nil {
		return endpointCreationError
	}

	return response.JSON(w, endpoint)
}

func (handler *Handler) createEndpoint(payload *endpointCreatePayload) (*portainer.Endpoint, *httperror.HandlerError) {
	if portainer.EndpointType(payload.EndpointType) == portainer.AzureEnvironment {
		return handler.createAzureEndpoint(payload)
	}

	if payload.TLS {
		return handler.createTLSSecuredEndpoint(payload)
	}
	return handler.createUnsecuredEndpoint(payload)
}

func (handler *Handler) createAzureEndpoint(payload *endpointCreatePayload) (*portainer.Endpoint, *httperror.HandlerError) {
	credentials := portainer.AzureCredentials{
		ApplicationID:     payload.AzureApplicationID,
		TenantID:          payload.AzureTenantID,
		AuthenticationKey: payload.AzureAuthenticationKey,
	}

	httpClient := client.NewHTTPClient()
	_, err := httpClient.ExecuteAzureAuthenticationRequest(&credentials)
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to authenticate against Azure", err}
	}

	endpoint := &portainer.Endpoint{
		Name:             payload.Name,
		URL:              payload.URL,
		Type:             portainer.AzureEnvironment,
		GroupID:          portainer.EndpointGroupID(payload.GroupID),
		PublicURL:        payload.PublicURL,
		AuthorizedUsers:  []portainer.UserID{},
		AuthorizedTeams:  []portainer.TeamID{},
		Extensions:       []portainer.EndpointExtension{},
		AzureCredentials: credentials,
		Tags:             payload.Tags,
		Status:           portainer.EndpointStatusUp,
		Snapshots:        []portainer.Snapshot{},
	}

	err = handler.EndpointService.CreateEndpoint(endpoint)
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint inside the database", err}
	}

	return endpoint, nil
}

func (handler *Handler) createUnsecuredEndpoint(payload *endpointCreatePayload) (*portainer.Endpoint, *httperror.HandlerError) {
	endpointType := portainer.DockerEnvironment

	if payload.URL == "" {
		payload.URL = "unix:///var/run/docker.sock"
		if runtime.GOOS == "windows" {
			payload.URL = "npipe:////./pipe/docker_engine"
		}
	} else {
		agentOnDockerEnvironment, err := client.ExecutePingOperation(payload.URL, nil)
		if err != nil {
			return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to ping Docker environment", err}
		}
		if agentOnDockerEnvironment {
			endpointType = portainer.AgentOnDockerEnvironment
		}
	}

	endpoint := &portainer.Endpoint{
		Name:      payload.Name,
		URL:       payload.URL,
		Type:      endpointType,
		GroupID:   portainer.EndpointGroupID(payload.GroupID),
		PublicURL: payload.PublicURL,
		TLSConfig: portainer.TLSConfiguration{
			TLS: false,
		},
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
		Extensions:      []portainer.EndpointExtension{},
		Tags:            payload.Tags,
		Status:          portainer.EndpointStatusUp,
		Snapshots:       []portainer.Snapshot{},
	}

	err := handler.snapshotAndPersistEndpoint(endpoint)
	if err != nil {
		return nil, err
	}

	return endpoint, nil
}

func (handler *Handler) createTLSSecuredEndpoint(payload *endpointCreatePayload) (*portainer.Endpoint, *httperror.HandlerError) {
	tlsConfig, err := crypto.CreateTLSConfigurationFromBytes(payload.TLSCACertFile, payload.TLSCertFile, payload.TLSKeyFile, payload.TLSSkipClientVerify, payload.TLSSkipVerify)
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to create TLS configuration", err}
	}

	agentOnDockerEnvironment, err := client.ExecutePingOperation(payload.URL, tlsConfig)
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to ping Docker environment", err}
	}

	endpointType := portainer.DockerEnvironment
	if agentOnDockerEnvironment {
		endpointType = portainer.AgentOnDockerEnvironment
	}

	endpoint := &portainer.Endpoint{
		Name:      payload.Name,
		URL:       payload.URL,
		Type:      endpointType,
		GroupID:   portainer.EndpointGroupID(payload.GroupID),
		PublicURL: payload.PublicURL,
		TLSConfig: portainer.TLSConfiguration{
			TLS:           payload.TLS,
			TLSSkipVerify: payload.TLSSkipVerify,
		},
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
		Extensions:      []portainer.EndpointExtension{},
		Tags:            payload.Tags,
		Status:          portainer.EndpointStatusUp,
		Snapshots:       []portainer.Snapshot{},
	}

	endpointCreationError := handler.snapshotAndPersistEndpoint(endpoint)
	if endpointCreationError != nil {
		return nil, endpointCreationError
	}

	filesystemError := handler.storeTLSFiles(endpoint, payload)
	if err != nil {
		handler.EndpointService.DeleteEndpoint(endpoint.ID)
		return nil, filesystemError
	}

	err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint changes inside the database", err}
	}

	return endpoint, nil
}

func (handler *Handler) snapshotAndPersistEndpoint(endpoint *portainer.Endpoint) *httperror.HandlerError {
	snapshot, err := handler.Snapshotter.CreateSnapshot(endpoint)
	endpoint.Status = portainer.EndpointStatusUp
	if err != nil {
		log.Printf("http error: endpoint snapshot error (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
		endpoint.Status = portainer.EndpointStatusDown
	}

	if snapshot != nil {
		endpoint.Snapshots = []portainer.Snapshot{*snapshot}
	}

	err = handler.EndpointService.CreateEndpoint(endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint inside the database", err}
	}

	return nil
}

func (handler *Handler) storeTLSFiles(endpoint *portainer.Endpoint, payload *endpointCreatePayload) *httperror.HandlerError {
	folder := strconv.Itoa(int(endpoint.ID))

	if !payload.TLSSkipVerify {
		caCertPath, err := handler.FileService.StoreTLSFileFromBytes(folder, portainer.TLSFileCA, payload.TLSCACertFile)
		if err != nil {
			handler.EndpointService.DeleteEndpoint(endpoint.ID)
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist TLS CA certificate file on disk", err}
		}
		endpoint.TLSConfig.TLSCACertPath = caCertPath
	}

	if !payload.TLSSkipClientVerify {
		certPath, err := handler.FileService.StoreTLSFileFromBytes(folder, portainer.TLSFileCert, payload.TLSCertFile)
		if err != nil {
			handler.EndpointService.DeleteEndpoint(endpoint.ID)
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist TLS certificate file on disk", err}
		}
		endpoint.TLSConfig.TLSCertPath = certPath

		keyPath, err := handler.FileService.StoreTLSFileFromBytes(folder, portainer.TLSFileKey, payload.TLSKeyFile)
		if err != nil {
			handler.EndpointService.DeleteEndpoint(endpoint.ID)
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist TLS key file on disk", err}
		}
		endpoint.TLSConfig.TLSKeyPath = keyPath
	}

	return nil
}
