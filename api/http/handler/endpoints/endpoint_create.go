package endpoints

import (
	"crypto/tls"
	"errors"
	"net/http"
	"runtime"
	"strconv"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/agent"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/client"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/endpointutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/gofrs/uuid"
)

type endpointCreatePayload struct {
	Name                   string
	URL                    string
	EndpointCreationType   endpointCreationEnum
	PublicURL              string
	Gpus                   []portainer.Pair
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
	ContainerEngine        string
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
		return errors.New("invalid environment name")
	}
	payload.Name = name

	endpointCreationType, err := request.RetrieveNumericMultiPartFormValue(r, "EndpointCreationType", false)
	if err != nil || endpointCreationType == 0 {
		return errors.New("invalid environment type value. Value must be one of: 1 (Docker environment), 2 (Agent environment), 3 (Azure environment), 4 (Edge Agent environment) or 5 (Local Kubernetes environment)")
	}
	payload.EndpointCreationType = endpointCreationEnum(endpointCreationType)

	payload.ContainerEngine, err = request.RetrieveMultiPartFormValue(r, "ContainerEngine", true)
	if err != nil || (payload.ContainerEngine != portainer.ContainerEngineDocker && payload.ContainerEngine != portainer.ContainerEnginePodman && payload.ContainerEngine != "") {
		return errors.New("invalid container engine value. Value must be one of: 'docker' or 'podman'")
	}

	groupID, _ := request.RetrieveNumericMultiPartFormValue(r, "GroupID", true)
	if groupID == 0 {
		groupID = 1
	}
	payload.GroupID = groupID

	var tagIDs []portainer.TagID
	if err := request.RetrieveMultiPartFormJSONValue(r, "TagIds", &tagIDs, true); err != nil {
		return errors.New("invalid TagIds parameter")
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
				return errors.New("invalid CA certificate file. Ensure that the file is uploaded correctly")
			}

			payload.TLSCACertFile = caCert
		}

		if !payload.TLSSkipClientVerify {
			cert, _, err := request.RetrieveMultiPartFormFile(r, "TLSCertFile")
			if err != nil {
				return errors.New("invalid certificate file. Ensure that the file is uploaded correctly")
			}
			payload.TLSCertFile = cert

			key, _, err := request.RetrieveMultiPartFormFile(r, "TLSKeyFile")
			if err != nil {
				return errors.New("invalid key file. Ensure that the file is uploaded correctly")
			}

			payload.TLSKeyFile = key
		}
	}

	switch payload.EndpointCreationType {
	case azureEnvironment:
		azureApplicationID, err := request.RetrieveMultiPartFormValue(r, "AzureApplicationID", false)
		if err != nil {
			return errors.New("invalid Azure application ID")
		}

		payload.AzureApplicationID = azureApplicationID

		azureTenantID, err := request.RetrieveMultiPartFormValue(r, "AzureTenantID", false)
		if err != nil {
			return errors.New("invalid Azure tenant ID")
		}
		payload.AzureTenantID = azureTenantID

		azureAuthenticationKey, err := request.RetrieveMultiPartFormValue(r, "AzureAuthenticationKey", false)
		if err != nil {
			return errors.New("invalid Azure authentication key")
		}
		payload.AzureAuthenticationKey = azureAuthenticationKey

	case edgeAgentEnvironment:
		endpointURL, err := request.RetrieveMultiPartFormValue(r, "URL", false)
		if err != nil || strings.EqualFold("", strings.Trim(endpointURL, " ")) {
			return errors.New("URL cannot be empty")
		}

		payload.URL = endpointURL

		publicURL, _ := request.RetrieveMultiPartFormValue(r, "PublicURL", true)
		payload.PublicURL = publicURL

	default:
		endpointURL, err := request.RetrieveMultiPartFormValue(r, "URL", true)
		if err != nil {
			return errors.New("invalid environment URL")
		}
		payload.URL = endpointURL

		publicURL, _ := request.RetrieveMultiPartFormValue(r, "PublicURL", true)
		payload.PublicURL = publicURL
	}

	gpus := make([]portainer.Pair, 0)
	if err := request.RetrieveMultiPartFormJSONValue(r, "Gpus", &gpus, true); err != nil {
		return errors.New("invalid Gpus parameter")
	}

	payload.Gpus = gpus

	edgeCheckinInterval, _ := request.RetrieveNumericMultiPartFormValue(r, "EdgeCheckinInterval", true)
	if edgeCheckinInterval == 0 {
		// deprecated CheckinInterval
		edgeCheckinInterval, _ = request.RetrieveNumericMultiPartFormValue(r, "CheckinInterval", true)
	}
	payload.EdgeCheckinInterval = edgeCheckinInterval

	return nil
}

// @id EndpointCreate
// @summary Create a new environment(endpoint)
// @description  Create a new environment(endpoint) that will be used to manage an environment(endpoint).
// @description **Access policy**: administrator
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @accept multipart/form-data
// @produce json
// @param Name formData string true "Name that will be used to identify this environment(endpoint) (example: my-environment)"
// @param EndpointCreationType formData integer true "Environment(Endpoint) type. Value must be one of: 1 (Local Docker environment), 2 (Agent environment), 3 (Azure environment), 4 (Edge agent environment) or 5 (Local Kubernetes Environment)" Enum(1,2,3,4,5)
// @param ContainerEngine formData string false "Container engine used by the environment(endpoint). Value must be one of: 'docker' or 'podman'"
// @param URL formData string false "URL or IP address of a Docker host (example: docker.mydomain.tld:2375). Defaults to local if not specified (Linux: /var/run/docker.sock, Windows: //./pipe/docker_engine). Cannot be empty if EndpointCreationType is set to 4 (Edge agent environment)"
// @param PublicURL formData string false "URL or IP address where exposed containers will be reachable. Defaults to URL if not specified (example: docker.mydomain.tld:2375)"
// @param GroupID formData int false "Environment(Endpoint) group identifier. If not specified will default to 1 (unassigned)."
// @param TLS formData bool false "Require TLS to connect against this environment(endpoint). Must be true if EndpointCreationType is set to 2 (Agent environment)"
// @param TLSSkipVerify formData bool false "Skip server verification when using TLS. Must be true if EndpointCreationType is set to 2 (Agent environment)"
// @param TLSSkipClientVerify formData bool false "Skip client verification when using TLS. Must be true if EndpointCreationType is set to 2 (Agent environment)"
// @param TLSCACertFile formData file false "TLS CA certificate file"
// @param TLSCertFile formData file false "TLS client certificate file"
// @param TLSKeyFile formData file false "TLS client key file"
// @param AzureApplicationID formData string false "Azure application ID. Required if environment(endpoint) type is set to 3"
// @param AzureTenantID formData string false "Azure tenant ID. Required if environment(endpoint) type is set to 3"
// @param AzureAuthenticationKey formData string false "Azure authentication key. Required if environment(endpoint) type is set to 3"
// @param TagIds formData []int false "List of tag identifiers to which this environment(endpoint) is associated"
// @param EdgeCheckinInterval formData int false "The check in interval for edge agent (in seconds)"
// @param EdgeTunnelServerAddress formData string true "URL or IP address that will be used to establish a reverse tunnel"
// @param Gpus formData string false "List of GPUs - json stringified array of {name, value} structs"
// @success 200 {object} portainer.Endpoint "Success"
// @failure 400 "Invalid request"
// @failure 409 "Name is not unique"
// @failure 500 "Server error"
// @router /endpoints [post]
func (handler *Handler) endpointCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := &endpointCreatePayload{}
	if err := payload.Validate(r); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	isUnique, err := handler.isNameUnique(payload.Name, 0)
	if err != nil {
		return httperror.InternalServerError("Unable to check if name is unique", err)
	}

	if !isUnique {
		return httperror.Conflict("Name is not unique", nil)
	}

	endpoint, endpointCreationError := handler.createEndpoint(handler.DataStore, payload)
	if endpointCreationError != nil {
		return endpointCreationError
	}

	endpointGroup, err := handler.DataStore.EndpointGroup().Read(endpoint.GroupID)
	if err != nil {
		return httperror.InternalServerError("Unable to find an environment group inside the database", err)
	}

	edgeGroups, err := handler.DataStore.EdgeGroup().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge groups from the database", err)
	}

	edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge stacks from the database", err)
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
	} else if endpointutils.IsKubernetesEndpoint(endpoint) {
		endpointutils.InitialIngressClassDetection(
			endpoint,
			handler.DataStore.Endpoint(),
			handler.K8sClientFactory,
		)
		endpointutils.InitialMetricsDetection(
			endpoint,
			handler.DataStore.Endpoint(),
			handler.K8sClientFactory,
		)
		endpointutils.InitialStorageDetection(
			endpoint,
			handler.DataStore.Endpoint(),
			handler.K8sClientFactory,
		)
	}

	if err := handler.DataStore.EndpointRelation().Create(relationObject); err != nil {
		return httperror.InternalServerError("Unable to persist the relation object inside the database", err)
	}

	return response.JSON(w, endpoint)
}

func (handler *Handler) createEndpoint(tx dataservices.DataStoreTx, payload *endpointCreatePayload) (*portainer.Endpoint, *httperror.HandlerError) {
	var err error

	switch payload.EndpointCreationType {
	case azureEnvironment:
		return handler.createAzureEndpoint(tx, payload)

	case edgeAgentEnvironment:
		return handler.createEdgeAgentEndpoint(tx, payload)

	case localKubernetesEnvironment:
		return handler.createKubernetesEndpoint(tx, payload)
	}

	endpointType := portainer.DockerEnvironment
	var agentVersion string
	if payload.EndpointCreationType == agentEnvironment {
		var tlsConfig *tls.Config
		if payload.TLS {
			tlsConfig, err = crypto.CreateTLSConfigurationFromBytes(payload.TLSCACertFile, payload.TLSCertFile, payload.TLSKeyFile, payload.TLSSkipVerify, payload.TLSSkipClientVerify)
			if err != nil {
				return nil, httperror.InternalServerError("Unable to create TLS configuration", err)
			}
		}

		agentPlatform, version, err := agent.GetAgentVersionAndPlatform(payload.URL, tlsConfig)
		if err != nil {
			return nil, httperror.InternalServerError("Unable to get environment type", err)
		}

		agentVersion = version
		if agentPlatform == portainer.AgentPlatformDocker {
			endpointType = portainer.AgentOnDockerEnvironment
		} else if agentPlatform == portainer.AgentPlatformKubernetes {
			endpointType = portainer.AgentOnKubernetesEnvironment
			payload.URL = strings.TrimPrefix(payload.URL, "tcp://")
		}
	}

	if payload.TLS {
		return handler.createTLSSecuredEndpoint(tx, payload, endpointType, agentVersion)
	}

	return handler.createUnsecuredEndpoint(tx, payload)
}

func (handler *Handler) createAzureEndpoint(tx dataservices.DataStoreTx, payload *endpointCreatePayload) (*portainer.Endpoint, *httperror.HandlerError) {
	credentials := portainer.AzureCredentials{
		ApplicationID:     payload.AzureApplicationID,
		TenantID:          payload.AzureTenantID,
		AuthenticationKey: payload.AzureAuthenticationKey,
	}

	httpClient := client.NewHTTPClient()
	if _, err := httpClient.ExecuteAzureAuthenticationRequest(&credentials); err != nil {
		return nil, httperror.InternalServerError("Unable to authenticate against Azure", err)
	}

	endpointID := tx.Endpoint().GetNextIdentifier()
	endpoint := &portainer.Endpoint{
		ID:                 portainer.EndpointID(endpointID),
		Name:               payload.Name,
		URL:                "https://management.azure.com",
		Type:               portainer.AzureEnvironment,
		GroupID:            portainer.EndpointGroupID(payload.GroupID),
		PublicURL:          payload.PublicURL,
		Gpus:               payload.Gpus,
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		AzureCredentials:   credentials,
		TagIDs:             payload.TagIDs,
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.DockerSnapshot{},
		Kubernetes:         portainer.KubernetesDefault(),
	}

	if err := handler.saveEndpointAndUpdateAuthorizations(tx, endpoint); err != nil {
		return nil, httperror.InternalServerError("An error occurred while trying to create the environment", err)
	}

	return endpoint, nil
}

func (handler *Handler) createEdgeAgentEndpoint(tx dataservices.DataStoreTx, payload *endpointCreatePayload) (*portainer.Endpoint, *httperror.HandlerError) {
	endpointID := handler.DataStore.Endpoint().GetNextIdentifier()

	portainerHost, err := edge.ParseHostForEdge(payload.URL)
	if err != nil {
		return nil, httperror.BadRequest("Unable to parse host", err)
	}

	edgeKey := handler.ReverseTunnelService.GenerateEdgeKey(payload.URL, portainerHost, endpointID)

	endpoint := &portainer.Endpoint{
		ID:              portainer.EndpointID(endpointID),
		Name:            payload.Name,
		URL:             portainerHost,
		Type:            portainer.EdgeAgentOnDockerEnvironment,
		ContainerEngine: payload.ContainerEngine,
		GroupID:         portainer.EndpointGroupID(payload.GroupID),
		Gpus:            payload.Gpus,
		TLSConfig: portainer.TLSConfiguration{
			TLS: false,
		},
		UserAccessPolicies:  portainer.UserAccessPolicies{},
		TeamAccessPolicies:  portainer.TeamAccessPolicies{},
		TagIDs:              payload.TagIDs,
		Status:              portainer.EndpointStatusUp,
		Snapshots:           []portainer.DockerSnapshot{},
		EdgeKey:             edgeKey,
		EdgeCheckinInterval: payload.EdgeCheckinInterval,
		Kubernetes:          portainer.KubernetesDefault(),
		UserTrusted:         true,
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve the settings from the database", err)
	}

	if settings.EnforceEdgeID {
		edgeID, err := uuid.NewV4()
		if err != nil {
			return nil, httperror.InternalServerError("Cannot generate the Edge ID", err)
		}

		endpoint.EdgeID = edgeID.String()
	}

	if err := handler.saveEndpointAndUpdateAuthorizations(tx, endpoint); err != nil {
		return nil, httperror.InternalServerError("An error occurred while trying to create the environment", err)
	}

	return endpoint, nil
}

func (handler *Handler) createUnsecuredEndpoint(tx dataservices.DataStoreTx, payload *endpointCreatePayload) (*portainer.Endpoint, *httperror.HandlerError) {
	endpointType := portainer.DockerEnvironment

	if payload.URL == "" {
		if payload.ContainerEngine == portainer.ContainerEnginePodman {
			payload.URL = "unix:///var/run/podman/podman.sock"
		} else {
			payload.URL = "unix:///var/run/docker.sock"
		}
		if runtime.GOOS == "windows" {
			payload.URL = "npipe:////./pipe/docker_engine"
		}
	}

	endpointID := tx.Endpoint().GetNextIdentifier()
	endpoint := &portainer.Endpoint{
		ID:              portainer.EndpointID(endpointID),
		Name:            payload.Name,
		URL:             payload.URL,
		Type:            endpointType,
		ContainerEngine: payload.ContainerEngine,
		GroupID:         portainer.EndpointGroupID(payload.GroupID),
		PublicURL:       payload.PublicURL,
		Gpus:            payload.Gpus,
		TLSConfig: portainer.TLSConfiguration{
			TLS: false,
		},
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		TagIDs:             payload.TagIDs,
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.DockerSnapshot{},
		Kubernetes:         portainer.KubernetesDefault(),
	}

	if err := handler.snapshotAndPersistEndpoint(tx, endpoint); err != nil {
		return nil, err
	}

	return endpoint, nil
}

func (handler *Handler) createKubernetesEndpoint(tx dataservices.DataStoreTx, payload *endpointCreatePayload) (*portainer.Endpoint, *httperror.HandlerError) {
	if payload.URL == "" {
		payload.URL = "https://kubernetes.default.svc"
	}

	endpointID := tx.Endpoint().GetNextIdentifier()

	endpoint := &portainer.Endpoint{
		ID:        portainer.EndpointID(endpointID),
		Name:      payload.Name,
		URL:       payload.URL,
		Type:      portainer.KubernetesLocalEnvironment,
		GroupID:   portainer.EndpointGroupID(payload.GroupID),
		PublicURL: payload.PublicURL,
		Gpus:      payload.Gpus,
		TLSConfig: portainer.TLSConfiguration{
			TLS:           payload.TLS,
			TLSSkipVerify: payload.TLSSkipVerify,
		},
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		TagIDs:             payload.TagIDs,
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.DockerSnapshot{},
		Kubernetes:         portainer.KubernetesDefault(),
	}

	if err := handler.snapshotAndPersistEndpoint(tx, endpoint); err != nil {
		return nil, err
	}

	return endpoint, nil
}

func (handler *Handler) createTLSSecuredEndpoint(tx dataservices.DataStoreTx, payload *endpointCreatePayload, endpointType portainer.EndpointType, agentVersion string) (*portainer.Endpoint, *httperror.HandlerError) {
	endpointID := tx.Endpoint().GetNextIdentifier()
	endpoint := &portainer.Endpoint{
		ID:              portainer.EndpointID(endpointID),
		Name:            payload.Name,
		URL:             payload.URL,
		Type:            endpointType,
		ContainerEngine: payload.ContainerEngine,
		GroupID:         portainer.EndpointGroupID(payload.GroupID),
		PublicURL:       payload.PublicURL,
		Gpus:            payload.Gpus,
		TLSConfig: portainer.TLSConfiguration{
			TLS:           payload.TLS,
			TLSSkipVerify: payload.TLSSkipVerify,
		},
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		TagIDs:             payload.TagIDs,
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.DockerSnapshot{},
		Kubernetes:         portainer.KubernetesDefault(),
	}

	endpoint.Agent.Version = agentVersion

	if err := handler.storeTLSFiles(endpoint, payload); err != nil {
		return nil, err
	}

	if err := handler.snapshotAndPersistEndpoint(tx, endpoint); err != nil {
		return nil, err
	}

	return endpoint, nil
}

func (handler *Handler) snapshotAndPersistEndpoint(tx dataservices.DataStoreTx, endpoint *portainer.Endpoint) *httperror.HandlerError {
	if err := handler.SnapshotService.SnapshotEndpoint(endpoint); err != nil {
		if (endpoint.Type == portainer.AgentOnDockerEnvironment && strings.Contains(err.Error(), "Invalid request signature")) ||
			(endpoint.Type == portainer.AgentOnKubernetesEnvironment && strings.Contains(err.Error(), "unknown")) {
			err = errors.New("agent already paired with another Portainer instance")
		}

		return httperror.InternalServerError("Unable to initiate communications with environment", err)
	}

	if err := handler.saveEndpointAndUpdateAuthorizations(tx, endpoint); err != nil {
		return httperror.InternalServerError("An error occurred while trying to create the environment", err)
	}

	return nil
}

func (handler *Handler) saveEndpointAndUpdateAuthorizations(tx dataservices.DataStoreTx, endpoint *portainer.Endpoint) error {
	endpoint.SecuritySettings = portainer.EndpointSecuritySettings{
		AllowVolumeBrowserForRegularUsers: false,
		EnableHostManagementFeatures:      false,

		AllowSysctlSettingForRegularUsers:         true,
		AllowBindMountsForRegularUsers:            true,
		AllowPrivilegedModeForRegularUsers:        true,
		AllowHostNamespaceForRegularUsers:         true,
		AllowContainerCapabilitiesForRegularUsers: true,
		AllowDeviceMappingForRegularUsers:         true,
		AllowStackManagementForRegularUsers:       true,
	}

	if err := tx.Endpoint().Create(endpoint); err != nil {
		return err
	}

	for _, tagID := range endpoint.TagIDs {
		if err := tx.Tag().UpdateTagFunc(tagID, func(tag *portainer.Tag) {
			tag.Endpoints[endpoint.ID] = true
		}); err != nil {
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
			return httperror.InternalServerError("Unable to persist TLS CA certificate file on disk", err)
		}

		endpoint.TLSConfig.TLSCACertPath = caCertPath
	}

	if payload.TLSSkipClientVerify {
		return nil
	}

	certPath, err := handler.FileService.StoreTLSFileFromBytes(folder, portainer.TLSFileCert, payload.TLSCertFile)
	if err != nil {
		return httperror.InternalServerError("Unable to persist TLS certificate file on disk", err)
	}

	endpoint.TLSConfig.TLSCertPath = certPath

	keyPath, err := handler.FileService.StoreTLSFileFromBytes(folder, portainer.TLSFileKey, payload.TLSKeyFile)
	if err != nil {
		return httperror.InternalServerError("Unable to persist TLS key file on disk", err)
	}
	endpoint.TLSConfig.TLSKeyPath = keyPath

	return nil
}
