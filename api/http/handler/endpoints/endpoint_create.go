package endpoints

import (
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"runtime"
	"strconv"
	"strings"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/http/client"
	"github.com/portainer/portainer/api/internal/edge"
)

type endpointCreatePayload struct {
	Name                   string
	URL                    string
	EndpointCreationType   endpointCreationEnum
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
	TagIDs                 []portainer.TagID
	EdgeCheckinInterval    int
}

type endpointCreationEnum int

const (
	_ endpointCreationEnum = iota
	localDockerEnvironment
	agentEnvironment
	azureEnvironment
	edgeAgentEnvironment
	localKubernetesEnvironment
)

func (payload *endpointCreatePayload) Validate(r *http.Request) error {
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return errors.New("Invalid endpoint name")
	}
	payload.Name = name

	endpointCreationType, err := request.RetrieveNumericMultiPartFormValue(r, "EndpointCreationType", false)
	if err != nil || endpointCreationType == 0 {
		return errors.New("Invalid endpoint type value. Value must be one of: 1 (Docker environment), 2 (Agent environment), 3 (Azure environment), 4 (Edge Agent environment) or 5 (Local Kubernetes environment)")
	}
	payload.EndpointCreationType = endpointCreationEnum(endpointCreationType)

	groupID, _ := request.RetrieveNumericMultiPartFormValue(r, "GroupID", true)
	if groupID == 0 {
		groupID = 1
	}
	payload.GroupID = groupID

	var tagIDs []portainer.TagID
	err = request.RetrieveMultiPartFormJSONValue(r, "TagIds", &tagIDs, true)
	if err != nil {
		return errors.New("Invalid TagIds parameter")
	}
	payload.TagIDs = tagIDs
	if payload.TagIDs == nil {
		payload.TagIDs = make([]portainer.TagID, 0)
	}

	useTLS, _ := request.RetrieveBooleanMultiPartFormValue(r, "TLS", true)
	payload.TLS = useTLS

	if payload.TLS {
		skipTLSServerVerification, _ := request.RetrieveBooleanMultiPartFormValue(r, "TLSSkipVerify", true)
		payload.TLSSkipVerify = skipTLSServerVerification
		skipTLSClientVerification, _ := request.RetrieveBooleanMultiPartFormValue(r, "TLSSkipClientVerify", true)
		payload.TLSSkipClientVerify = skipTLSClientVerification

		if !payload.TLSSkipVerify {
			caCert, _, err := request.RetrieveMultiPartFormFile(r, "TLSCACertFile")
			if err != nil {
				return errors.New("Invalid CA certificate file. Ensure that the file is uploaded correctly")
			}
			payload.TLSCACertFile = caCert
		}

		if !payload.TLSSkipClientVerify {
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
		}
	}

	switch payload.EndpointCreationType {
	case azureEnvironment:
		azureApplicationID, err := request.RetrieveMultiPartFormValue(r, "AzureApplicationID", false)
		if err != nil {
			return errors.New("Invalid Azure application ID")
		}
		payload.AzureApplicationID = azureApplicationID

		azureTenantID, err := request.RetrieveMultiPartFormValue(r, "AzureTenantID", false)
		if err != nil {
			return errors.New("Invalid Azure tenant ID")
		}
		payload.AzureTenantID = azureTenantID

		azureAuthenticationKey, err := request.RetrieveMultiPartFormValue(r, "AzureAuthenticationKey", false)
		if err != nil {
			return errors.New("Invalid Azure authentication key")
		}
		payload.AzureAuthenticationKey = azureAuthenticationKey
	default:
		endpointURL, err := request.RetrieveMultiPartFormValue(r, "URL", true)
		if err != nil {
			return errors.New("Invalid endpoint URL")
		}
		payload.URL = endpointURL

		publicURL, _ := request.RetrieveMultiPartFormValue(r, "PublicURL", true)
		payload.PublicURL = publicURL
	}

	checkinInterval, _ := request.RetrieveNumericMultiPartFormValue(r, "CheckinInterval", true)
	payload.EdgeCheckinInterval = checkinInterval

	return nil
}

// Create endpoint
// @summary Creates an endpoint
// @description
// @tags endpoints
// @security jwt
// @accept json
// @produce json
// @param body body endpointCreatePayload true "endpoint data"
// @success 200 {object} portainer.Endpoint "Endpoint"
// @failure 400,500
// @router /endpoints [post]
func (handler *Handler) endpointCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := &endpointCreatePayload{}
	err := payload.Validate(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	endpoint, endpointCreationError := handler.createEndpoint(payload)
	if endpointCreationError != nil {
		return endpointCreationError
	}

	endpointGroup, err := handler.DataStore.EndpointGroup().EndpointGroup(endpoint.GroupID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint group inside the database", err}
	}

	edgeGroups, err := handler.DataStore.EdgeGroup().EdgeGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge groups from the database", err}
	}

	edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge stacks from the database", err}
	}

	relationObject := &portainer.EndpointRelation{
		EndpointID: endpoint.ID,
		EdgeStacks: map[portainer.EdgeStackID]bool{},
	}

	if endpoint.Type == portainer.EdgeAgentOnDockerEnvironment || endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment {
		relatedEdgeStacks := edge.EndpointRelatedEdgeStacks(endpoint, endpointGroup, edgeGroups, edgeStacks)
		for _, stackID := range relatedEdgeStacks {
			relationObject.EdgeStacks[stackID] = true
		}
	}

	err = handler.DataStore.EndpointRelation().CreateEndpointRelation(relationObject)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the relation object inside the database", err}
	}

	return response.JSON(w, endpoint)
}

func (handler *Handler) createEndpoint(payload *endpointCreatePayload) (*portainer.Endpoint, *httperror.HandlerError) {
	switch payload.EndpointCreationType {
	case azureEnvironment:
		return handler.createAzureEndpoint(payload)

	case edgeAgentEnvironment:
		return handler.createEdgeAgentEndpoint(payload)

	case localKubernetesEnvironment:
		return handler.createKubernetesEndpoint(payload)
	}

	endpointType := portainer.DockerEnvironment
	if payload.EndpointCreationType == agentEnvironment {
		agentPlatform, err := handler.pingAndCheckPlatform(payload)
		if err != nil {
			return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to get endpoint type", err}
		}

		if agentPlatform == portainer.AgentPlatformDocker {
			endpointType = portainer.AgentOnDockerEnvironment
		} else if agentPlatform == portainer.AgentPlatformKubernetes {
			endpointType = portainer.AgentOnKubernetesEnvironment
			payload.URL = strings.TrimPrefix(payload.URL, "tcp://")
		}
	}

	if payload.TLS {
		return handler.createTLSSecuredEndpoint(payload, endpointType)
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

	endpointID := handler.DataStore.Endpoint().GetNextIdentifier()
	endpoint := &portainer.Endpoint{
		ID:                 portainer.EndpointID(endpointID),
		Name:               payload.Name,
		URL:                "https://management.azure.com",
		Type:               portainer.AzureEnvironment,
		GroupID:            portainer.EndpointGroupID(payload.GroupID),
		PublicURL:          payload.PublicURL,
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		Extensions:         []portainer.EndpointExtension{},
		AzureCredentials:   credentials,
		TagIDs:             payload.TagIDs,
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.DockerSnapshot{},
		Kubernetes:         portainer.KubernetesDefault(),
	}

	err = handler.saveEndpointAndUpdateAuthorizations(endpoint)
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "An error occured while trying to create the endpoint", err}
	}

	return endpoint, nil
}

func (handler *Handler) createEdgeAgentEndpoint(payload *endpointCreatePayload) (*portainer.Endpoint, *httperror.HandlerError) {
	endpointID := handler.DataStore.Endpoint().GetNextIdentifier()

	portainerURL, err := url.Parse(payload.URL)
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint URL", err}
	}

	portainerHost, _, err := net.SplitHostPort(portainerURL.Host)
	if err != nil {
		portainerHost = portainerURL.Host
	}

	if portainerHost == "localhost" {
		return nil, &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint URL", errors.New("cannot use localhost as endpoint URL")}
	}

	edgeKey := handler.ReverseTunnelService.GenerateEdgeKey(payload.URL, portainerHost, endpointID)

	endpoint := &portainer.Endpoint{
		ID:      portainer.EndpointID(endpointID),
		Name:    payload.Name,
		URL:     portainerHost,
		Type:    portainer.EdgeAgentOnDockerEnvironment,
		GroupID: portainer.EndpointGroupID(payload.GroupID),
		TLSConfig: portainer.TLSConfiguration{
			TLS: false,
		},
		AuthorizedUsers:     []portainer.UserID{},
		AuthorizedTeams:     []portainer.TeamID{},
		Extensions:          []portainer.EndpointExtension{},
		TagIDs:              payload.TagIDs,
		Status:              portainer.EndpointStatusUp,
		Snapshots:           []portainer.DockerSnapshot{},
		EdgeKey:             edgeKey,
		EdgeCheckinInterval: payload.EdgeCheckinInterval,
		Kubernetes:          portainer.KubernetesDefault(),
	}

	err = handler.saveEndpointAndUpdateAuthorizations(endpoint)
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "An error occured while trying to create the endpoint", err}
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
	}

	endpointID := handler.DataStore.Endpoint().GetNextIdentifier()
	endpoint := &portainer.Endpoint{
		ID:        portainer.EndpointID(endpointID),
		Name:      payload.Name,
		URL:       payload.URL,
		Type:      endpointType,
		GroupID:   portainer.EndpointGroupID(payload.GroupID),
		PublicURL: payload.PublicURL,
		TLSConfig: portainer.TLSConfiguration{
			TLS: false,
		},
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		Extensions:         []portainer.EndpointExtension{},
		TagIDs:             payload.TagIDs,
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.DockerSnapshot{},
		Kubernetes:         portainer.KubernetesDefault(),
	}

	err := handler.snapshotAndPersistEndpoint(endpoint)
	if err != nil {
		return nil, err
	}

	return endpoint, nil
}

func (handler *Handler) createKubernetesEndpoint(payload *endpointCreatePayload) (*portainer.Endpoint, *httperror.HandlerError) {
	if payload.URL == "" {
		payload.URL = "https://kubernetes.default.svc"
	}

	endpointID := handler.DataStore.Endpoint().GetNextIdentifier()

	endpoint := &portainer.Endpoint{
		ID:        portainer.EndpointID(endpointID),
		Name:      payload.Name,
		URL:       payload.URL,
		Type:      portainer.KubernetesLocalEnvironment,
		GroupID:   portainer.EndpointGroupID(payload.GroupID),
		PublicURL: payload.PublicURL,
		TLSConfig: portainer.TLSConfiguration{
			TLS:           payload.TLS,
			TLSSkipVerify: payload.TLSSkipVerify,
		},
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		Extensions:         []portainer.EndpointExtension{},
		TagIDs:             payload.TagIDs,
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.DockerSnapshot{},
		Kubernetes:         portainer.KubernetesDefault(),
	}

	err := handler.snapshotAndPersistEndpoint(endpoint)
	if err != nil {
		return nil, err
	}

	return endpoint, nil
}

func (handler *Handler) createTLSSecuredEndpoint(payload *endpointCreatePayload, endpointType portainer.EndpointType) (*portainer.Endpoint, *httperror.HandlerError) {
	endpointID := handler.DataStore.Endpoint().GetNextIdentifier()
	endpoint := &portainer.Endpoint{
		ID:        portainer.EndpointID(endpointID),
		Name:      payload.Name,
		URL:       payload.URL,
		Type:      endpointType,
		GroupID:   portainer.EndpointGroupID(payload.GroupID),
		PublicURL: payload.PublicURL,
		TLSConfig: portainer.TLSConfiguration{
			TLS:           payload.TLS,
			TLSSkipVerify: payload.TLSSkipVerify,
		},
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		Extensions:         []portainer.EndpointExtension{},
		TagIDs:             payload.TagIDs,
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.DockerSnapshot{},
		Kubernetes:         portainer.KubernetesDefault(),
	}

	err := handler.storeTLSFiles(endpoint, payload)
	if err != nil {
		return nil, err
	}

	err = handler.snapshotAndPersistEndpoint(endpoint)
	if err != nil {
		return nil, err
	}

	return endpoint, nil
}

func (handler *Handler) snapshotAndPersistEndpoint(endpoint *portainer.Endpoint) *httperror.HandlerError {
	err := handler.SnapshotService.SnapshotEndpoint(endpoint)
	if err != nil {
		if strings.Contains(err.Error(), "Invalid request signature") {
			err = errors.New("agent already paired with another Portainer instance")
		}
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to initiate communications with endpoint", err}
	}

	err = handler.saveEndpointAndUpdateAuthorizations(endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "An error occured while trying to create the endpoint", err}
	}

	return nil
}

func (handler *Handler) saveEndpointAndUpdateAuthorizations(endpoint *portainer.Endpoint) error {
	endpoint.SecuritySettings = portainer.EndpointSecuritySettings{
		AllowVolumeBrowserForRegularUsers: false,
		EnableHostManagementFeatures:      false,

		AllowBindMountsForRegularUsers:            true,
		AllowPrivilegedModeForRegularUsers:        true,
		AllowHostNamespaceForRegularUsers:         true,
		AllowContainerCapabilitiesForRegularUsers: true,
		AllowDeviceMappingForRegularUsers:         true,
		AllowStackManagementForRegularUsers:       true,
	}

	err := handler.DataStore.Endpoint().CreateEndpoint(endpoint)
	if err != nil {
		return err
	}

	for _, tagID := range endpoint.TagIDs {
		tag, err := handler.DataStore.Tag().Tag(tagID)
		if err != nil {
			return err
		}

		tag.Endpoints[endpoint.ID] = true

		err = handler.DataStore.Tag().UpdateTag(tagID, tag)
		if err != nil {
			return err
		}
	}

	return nil
}

func (handler *Handler) storeTLSFiles(endpoint *portainer.Endpoint, payload *endpointCreatePayload) *httperror.HandlerError {
	folder := strconv.Itoa(int(endpoint.ID))

	if !payload.TLSSkipVerify {
		caCertPath, err := handler.FileService.StoreTLSFileFromBytes(folder, portainer.TLSFileCA, payload.TLSCACertFile)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist TLS CA certificate file on disk", err}
		}
		endpoint.TLSConfig.TLSCACertPath = caCertPath
	}

	if !payload.TLSSkipClientVerify {
		certPath, err := handler.FileService.StoreTLSFileFromBytes(folder, portainer.TLSFileCert, payload.TLSCertFile)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist TLS certificate file on disk", err}
		}
		endpoint.TLSConfig.TLSCertPath = certPath

		keyPath, err := handler.FileService.StoreTLSFileFromBytes(folder, portainer.TLSFileKey, payload.TLSKeyFile)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist TLS key file on disk", err}
		}
		endpoint.TLSConfig.TLSKeyPath = keyPath
	}

	return nil
}

func (handler *Handler) pingAndCheckPlatform(payload *endpointCreatePayload) (portainer.AgentPlatform, error) {
	httpCli := &http.Client{
		Timeout: 3 * time.Second,
	}

	if payload.TLS {
		tlsConfig, err := crypto.CreateTLSConfigurationFromBytes(payload.TLSCACertFile, payload.TLSCertFile, payload.TLSKeyFile, payload.TLSSkipVerify, payload.TLSSkipClientVerify)
		if err != nil {
			return 0, err
		}

		httpCli.Transport = &http.Transport{
			TLSClientConfig: tlsConfig,
		}
	}

	url, err := url.Parse(fmt.Sprintf("%s/ping", payload.URL))
	if err != nil {
		return 0, err
	}

	url.Scheme = "https"

	req, err := http.NewRequest(http.MethodGet, url.String(), nil)
	if err != nil {
		return 0, err
	}

	resp, err := httpCli.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return 0, fmt.Errorf("Failed request with status %d", resp.StatusCode)
	}

	agentPlatformHeader := resp.Header.Get(portainer.HTTPResponseAgentPlatform)
	if agentPlatformHeader == "" {
		return 0, errors.New("Agent Platform Header is missing")
	}

	agentPlatformNumber, err := strconv.Atoi(agentPlatformHeader)
	if err != nil {
		return 0, err
	}

	if agentPlatformNumber == 0 {
		return 0, errors.New("Agent platform is invalid")
	}

	return portainer.AgentPlatform(agentPlatformNumber), nil
}
