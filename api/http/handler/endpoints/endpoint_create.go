package endpoints

import (
	"errors"
	"net"
	"net/http"
	"net/url"
	"runtime"
	"strconv"
	"strings"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/http/client"
)

type endpointCreatePayload struct {
	Name                string
	URL                 string
	EndpointType        int
	PublicURL           string
	GroupID             int
	TLS                 bool
	TLSSkipVerify       bool
	TLSSkipClientVerify bool
	TLSCACertFile       []byte
	TLSCertFile         []byte
	TLSKeyFile          []byte
	TagIDs              []portainer.TagID
	CheckinInteval      int
}

func (payload *endpointCreatePayload) Validate(r *http.Request) error {
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return portainer.Error("Invalid endpoint name")
	}
	payload.Name = name

	endpointType, err := request.RetrieveNumericMultiPartFormValue(r, "EndpointType", false)
	if err != nil || endpointType == 0 {
		return portainer.Error("Invalid endpoint type value. Value must be one of: 1 (Docker environment), 2 (Agent environment) or 4 (Edge Agent environment)")
	}
	payload.EndpointType = endpointType

	groupID, _ := request.RetrieveNumericMultiPartFormValue(r, "GroupID", true)
	if groupID == 0 {
		groupID = 1
	}
	payload.GroupID = groupID

	var tagIDs []portainer.TagID
	err = request.RetrieveMultiPartFormJSONValue(r, "TagIds", &tagIDs, true)
	if err != nil {
		return portainer.Error("Invalid TagIds parameter")
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
				return portainer.Error("Invalid CA certificate file. Ensure that the file is uploaded correctly")
			}
			payload.TLSCACertFile = caCert
		}

		if !payload.TLSSkipClientVerify {
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
	}

	endpointURL, err := request.RetrieveMultiPartFormValue(r, "URL", true)
	if err != nil {
		return portainer.Error("Invalid endpoint URL")
	}
	payload.URL = endpointURL

	publicURL, _ := request.RetrieveMultiPartFormValue(r, "PublicURL", true)
	payload.PublicURL = publicURL

	checkinInteval, _ := request.RetrieveNumericMultiPartFormValue(r, "CheckinInterval", true)
	payload.CheckinInteval = checkinInteval

	return nil
}

// POST request on /api/endpoints
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

	if endpoint.Type == portainer.EdgeAgentEnvironment {
		relatedEdgeStacks := portainer.EndpointRelatedEdgeStacks(endpoint, endpointGroup, edgeGroups, edgeStacks)
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
	if portainer.EndpointType(payload.EndpointType) == portainer.EdgeAgentEnvironment {
		return handler.createEdgeAgentEndpoint(payload)
	}

	if payload.TLS {
		return handler.createTLSSecuredEndpoint(payload)
	}
	return handler.createUnsecuredEndpoint(payload)
}

func (handler *Handler) createEdgeAgentEndpoint(payload *endpointCreatePayload) (*portainer.Endpoint, *httperror.HandlerError) {
	endpointType := portainer.EdgeAgentEnvironment
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
		Type:    endpointType,
		GroupID: portainer.EndpointGroupID(payload.GroupID),
		TLSConfig: portainer.TLSConfiguration{
			TLS: false,
		},
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
		Extensions:      []portainer.EndpointExtension{},
		TagIDs:          payload.TagIDs,
		Status:          portainer.EndpointStatusUp,
		Snapshots:       []portainer.Snapshot{},
		EdgeKey:         edgeKey,
		CheckinInterval: payload.CheckinInteval,
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
	} else {
		agentOnDockerEnvironment, err := client.ExecutePingOperation(payload.URL, nil)
		if err != nil {
			return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to ping Docker environment", err}
		}
		if agentOnDockerEnvironment {
			endpointType = portainer.AgentOnDockerEnvironment
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
		Snapshots:          []portainer.Snapshot{},
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
		Snapshots:          []portainer.Snapshot{},
	}

	filesystemError := handler.storeTLSFiles(endpoint, payload)
	if err != nil {
		return nil, filesystemError
	}

	endpointCreationError := handler.snapshotAndPersistEndpoint(endpoint)
	if endpointCreationError != nil {
		return nil, endpointCreationError
	}

	return endpoint, nil
}

func (handler *Handler) snapshotAndPersistEndpoint(endpoint *portainer.Endpoint) *httperror.HandlerError {
	snapshot, err := handler.Snapshotter.CreateSnapshot(endpoint)
	endpoint.Status = portainer.EndpointStatusUp
	if err != nil {
		if strings.Contains(err.Error(), "Invalid request signature") {
			err = errors.New("agent already paired with another Portainer instance")
		}
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to initiate communications with endpoint", err}
	}

	if snapshot != nil {
		endpoint.Snapshots = []portainer.Snapshot{*snapshot}
	}

	err = handler.saveEndpointAndUpdateAuthorizations(endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "An error occured while trying to create the endpoint", err}
	}

	return nil
}

func (handler *Handler) saveEndpointAndUpdateAuthorizations(endpoint *portainer.Endpoint) error {
	err := handler.DataStore.Endpoint().CreateEndpoint(endpoint)
	if err != nil {
		return err
	}

	group, err := handler.DataStore.EndpointGroup().EndpointGroup(endpoint.GroupID)
	if err != nil {
		return err
	}

	if len(group.UserAccessPolicies) > 0 || len(group.TeamAccessPolicies) > 0 {
		return handler.AuthorizationService.UpdateUsersAuthorizations()
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
