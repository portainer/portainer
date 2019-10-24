package docker

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"path"
	"regexp"
	"strings"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/responseutils"
	"github.com/portainer/portainer/api/http/security"
)

var apiVersionRe = regexp.MustCompile(`(/v[0-9]\.[0-9]*)?`)

type (
	// TODO: doco + rename to transport
	// + refactor to parameter + NewTransport functions
	ProxyTransport struct {
		HTTPTransport          *http.Transport
		EnableSignature        bool
		ResourceControlService portainer.ResourceControlService
		UserService            portainer.UserService
		TeamMembershipService  portainer.TeamMembershipService
		RegistryService        portainer.RegistryService
		DockerHubService       portainer.DockerHubService
		SettingsService        portainer.SettingsService
		SignatureService       portainer.DigitalSignatureService
		ReverseTunnelService   portainer.ReverseTunnelService
		ExtensionService       portainer.ExtensionService
		EndpointIdentifier     portainer.EndpointID
		EndpointType           portainer.EndpointType
	}
	restrictedDockerOperationContext struct {
		isAdmin                bool
		endpointResourceAccess bool
		userID                 portainer.UserID
		userTeamIDs            []portainer.TeamID
		resourceControls       []portainer.ResourceControl
	}

	operationExecutor struct {
		operationContext *restrictedDockerOperationContext
		labelBlackList   []portainer.Pair
	}
	restrictedOperationRequest func(*http.Response, *operationExecutor) error
	operationRequest           func(*http.Request) error
)

func (p *ProxyTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	return p.ProxyDockerRequest(request)
}

func (p *ProxyTransport) executeDockerRequest(request *http.Request) (*http.Response, error) {
	response, err := p.HTTPTransport.RoundTrip(request)

	if p.EndpointType != portainer.EdgeAgentEnvironment {
		return response, err
	}

	if err == nil {
		p.ReverseTunnelService.SetTunnelStatusToActive(p.EndpointIdentifier)
	} else {
		p.ReverseTunnelService.SetTunnelStatusToIdle(p.EndpointIdentifier)
	}

	return response, err
}

// TODO: doco
func (p *ProxyTransport) ProxyDockerRequest(request *http.Request) (*http.Response, error) {
	requestPath := apiVersionRe.ReplaceAllString(request.URL.Path, "")
	request.URL.Path = requestPath

	if p.EnableSignature {
		signature, err := p.SignatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
		if err != nil {
			return nil, err
		}

		request.Header.Set(portainer.PortainerAgentPublicKeyHeader, p.SignatureService.EncodedPublicKey())
		request.Header.Set(portainer.PortainerAgentSignatureHeader, signature)
	}

	switch {
	case strings.HasPrefix(requestPath, "/configs"):
		return p.proxyConfigRequest(request)
	case strings.HasPrefix(requestPath, "/containers"):
		return p.proxyContainerRequest(request)
	case strings.HasPrefix(requestPath, "/services"):
		return p.proxyServiceRequest(request)
	case strings.HasPrefix(requestPath, "/volumes"):
		return p.proxyVolumeRequest(request)
	case strings.HasPrefix(requestPath, "/networks"):
		return p.proxyNetworkRequest(request)
	case strings.HasPrefix(requestPath, "/secrets"):
		return p.proxySecretRequest(request)
	case strings.HasPrefix(requestPath, "/swarm"):
		return p.proxySwarmRequest(request)
	case strings.HasPrefix(requestPath, "/nodes"):
		return p.proxyNodeRequest(request)
	case strings.HasPrefix(requestPath, "/tasks"):
		return p.proxyTaskRequest(request)
	case strings.HasPrefix(requestPath, "/build"):
		return p.proxyBuildRequest(request)
	case strings.HasPrefix(requestPath, "/images"):
		return p.proxyImageRequest(request)
	case strings.HasPrefix(requestPath, "/v2"):
		return p.proxyAgentRequest(request)
	default:
		return p.executeDockerRequest(request)
	}
}

func (p *ProxyTransport) proxyAgentRequest(r *http.Request) (*http.Response, error) {
	requestPath := strings.TrimPrefix(r.URL.Path, "/v2")

	switch {
	case strings.HasPrefix(requestPath, "/browse"):
		volumeIDParameter, found := r.URL.Query()["volumeID"]
		if !found || len(volumeIDParameter) < 1 {
			return p.administratorOperation(r)
		}

		return p.restrictedVolumeBrowserOperation(r, volumeIDParameter[0])
	}

	return p.executeDockerRequest(r)
}

func (p *ProxyTransport) proxyConfigRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/configs/create":
		return p.decorateGenericResourceCreationOperation(request, configCreationIdentifier, portainer.ConfigResourceControl)

	case "/configs":
		return p.rewriteOperation(request, configListOperation)

	default:
		// assume /configs/{id}
		configID := path.Base(requestPath)

		if request.Method == http.MethodGet {
			return p.rewriteOperation(request, configInspectOperation)
		} else if request.Method == http.MethodDelete {
			return p.executeGenericResourceDeletionOperation(request, configID, portainer.ConfigResourceControl)
		}

		return p.restrictedOperation(request, configID, portainer.ConfigResourceControl)
	}
}

func (p *ProxyTransport) proxyContainerRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/containers/create":
		return p.decorateGenericResourceCreationOperation(request, containerIdentifier, portainer.ContainerResourceControl)

	case "/containers/prune":
		return p.administratorOperation(request)

	case "/containers/json":
		return p.rewriteOperationWithLabelFiltering(request, containerListOperation)

	default:
		// This section assumes /containers/**
		if match, _ := path.Match("/containers/*/*", requestPath); match {
			// Handle /containers/{id}/{action} requests
			containerID := path.Base(path.Dir(requestPath))
			action := path.Base(requestPath)

			if action == "json" {
				return p.rewriteOperation(request, containerInspectOperation)
			}
			return p.restrictedOperation(request, containerID, portainer.ContainerResourceControl)
		} else if match, _ := path.Match("/containers/*", requestPath); match {
			// Handle /containers/{id} requests
			containerID := path.Base(requestPath)

			if request.Method == http.MethodDelete {
				return p.executeGenericResourceDeletionOperation(request, containerID, portainer.ConfigResourceControl)
			}

			return p.restrictedOperation(request, containerID, portainer.ContainerResourceControl)
		}
		return p.executeDockerRequest(request)
	}
}

func (p *ProxyTransport) proxyServiceRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/services/create":
		return p.replaceRegistryAuthenticationHeader(request)

	case "/services":
		return p.rewriteOperation(request, serviceListOperation)

	default:
		// This section assumes /services/**
		if match, _ := path.Match("/services/*/*", requestPath); match {
			// Handle /services/{id}/{action} requests
			serviceID := path.Base(path.Dir(requestPath))
			return p.restrictedOperation(request, serviceID, portainer.ServiceResourceControl)
		} else if match, _ := path.Match("/services/*", requestPath); match {
			// Handle /services/{id} requests
			serviceID := path.Base(requestPath)

			if request.Method == http.MethodGet {
				return p.rewriteOperation(request, serviceInspectOperation)
			} else if request.Method == http.MethodDelete {
				return p.executeGenericResourceDeletionOperation(request, serviceID, portainer.ServiceResourceControl)
			}
			return p.restrictedOperation(request, serviceID, portainer.ServiceResourceControl)
		}
		return p.executeDockerRequest(request)
	}
}

func (p *ProxyTransport) proxyVolumeRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/volumes/create":
		return p.decorateGenericResourceCreationOperation(request, volumeIdentifier, portainer.VolumeResourceControl)

	case "/volumes/prune":
		return p.administratorOperation(request)

	case "/volumes":
		return p.rewriteOperation(request, volumeListOperation)

	default:
		// assume /volumes/{name}
		volumeID := path.Base(requestPath)

		if request.Method == http.MethodGet {
			return p.rewriteOperation(request, volumeInspectOperation)
		} else if request.Method == http.MethodDelete {
			return p.executeGenericResourceDeletionOperation(request, volumeID, portainer.VolumeResourceControl)
		}
		return p.restrictedOperation(request, volumeID, portainer.VolumeResourceControl)
	}
}

func (p *ProxyTransport) proxyNetworkRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/networks/create":
		return p.decorateGenericResourceCreationOperation(request, networkIdentifier, portainer.NetworkResourceControl)

	case "/networks":
		return p.rewriteOperation(request, networkListOperation)

	default:
		// assume /networks/{id}
		networkID := path.Base(requestPath)

		if request.Method == http.MethodGet {
			return p.rewriteOperation(request, networkInspectOperation)
		} else if request.Method == http.MethodDelete {
			return p.executeGenericResourceDeletionOperation(request, networkID, portainer.NetworkResourceControl)
		}
		return p.restrictedOperation(request, networkID, portainer.NetworkResourceControl)
	}
}

func (p *ProxyTransport) proxySecretRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/secrets/create":
		return p.decorateGenericResourceCreationOperation(request, secretIdentifier, portainer.SecretResourceControl)

	case "/secrets":
		return p.rewriteOperation(request, secretListOperation)

	default:
		// assume /secrets/{id}
		secretID := path.Base(requestPath)

		if request.Method == http.MethodGet {
			return p.rewriteOperation(request, secretInspectOperation)
		} else if request.Method == http.MethodDelete {
			return p.executeGenericResourceDeletionOperation(request, secretID, portainer.SecretResourceControl)
		}
		return p.restrictedOperation(request, secretID, portainer.SecretResourceControl)
	}
}

func (p *ProxyTransport) proxyNodeRequest(request *http.Request) (*http.Response, error) {
	requestPath := request.URL.Path

	// assume /nodes/{id}
	if path.Base(requestPath) != "nodes" {
		return p.administratorOperation(request)
	}

	return p.executeDockerRequest(request)
}

func (p *ProxyTransport) proxySwarmRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/swarm":
		return p.rewriteOperation(request, swarmInspectOperation)
	default:
		// assume /swarm/{action}
		return p.administratorOperation(request)
	}
}

func (p *ProxyTransport) proxyTaskRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/tasks":
		return p.rewriteOperation(request, taskListOperation)
	default:
		// assume /tasks/{id}
		return p.executeDockerRequest(request)
	}
}

func (p *ProxyTransport) proxyBuildRequest(request *http.Request) (*http.Response, error) {
	return p.interceptAndRewriteRequest(request, buildOperation)
}

func (p *ProxyTransport) proxyImageRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/images/create":
		return p.replaceRegistryAuthenticationHeader(request)
	default:
		if path.Base(requestPath) == "push" && request.Method == http.MethodPost {
			return p.replaceRegistryAuthenticationHeader(request)
		}
		return p.executeDockerRequest(request)
	}
}

func (p *ProxyTransport) replaceRegistryAuthenticationHeader(request *http.Request) (*http.Response, error) {
	accessContext, err := p.createRegistryAccessContext(request)
	if err != nil {
		return nil, err
	}

	originalHeader := request.Header.Get("X-Registry-Auth")

	if originalHeader != "" {

		decodedHeaderData, err := base64.StdEncoding.DecodeString(originalHeader)
		if err != nil {
			return nil, err
		}

		var originalHeaderData registryAuthenticationHeader
		err = json.Unmarshal(decodedHeaderData, &originalHeaderData)
		if err != nil {
			return nil, err
		}

		authenticationHeader := CreateRegistryAuthenticationHeader(originalHeaderData.Serveraddress, accessContext)

		headerData, err := json.Marshal(authenticationHeader)
		if err != nil {
			return nil, err
		}

		header := base64.StdEncoding.EncodeToString(headerData)

		request.Header.Set("X-Registry-Auth", header)
	}

	return p.decorateGenericResourceCreationOperation(request, serviceIdentifier, portainer.ServiceResourceControl)
}

// restrictedOperation ensures that the current user has the required authorizations
// before executing the original request.
func (p *ProxyTransport) restrictedOperation(request *http.Request, resourceID string, resourceType portainer.ResourceControlType) (*http.Response, error) {
	var err error
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	if tokenData.Role != portainer.AdministratorRole {

		teamMemberships, err := p.TeamMembershipService.TeamMembershipsByUserID(tokenData.ID)
		if err != nil {
			return nil, err
		}

		userTeamIDs := make([]portainer.TeamID, 0)
		for _, membership := range teamMemberships {
			userTeamIDs = append(userTeamIDs, membership.TeamID)
		}

		resourceControls, err := p.ResourceControlService.ResourceControls()
		if err != nil {
			return nil, err
		}

		resourceControl := portainer.GetResourceControlByResourceIDAndType(resourceID, resourceType, resourceControls)
		if resourceControl == nil || !portainer.UserCanAccessResource(tokenData.ID, userTeamIDs, resourceControl) {
			return responseutils.WriteAccessDeniedResponse()
		}
	}

	return p.executeDockerRequest(request)
}

// restrictedVolumeBrowserOperation is similar to restrictedOperation but adds an extra check on a specific setting
func (p *ProxyTransport) restrictedVolumeBrowserOperation(request *http.Request, resourceID string) (*http.Response, error) {
	var err error
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	if tokenData.Role != portainer.AdministratorRole {
		settings, err := p.SettingsService.Settings()
		if err != nil {
			return nil, err
		}

		_, err = p.ExtensionService.Extension(portainer.RBACExtension)
		if err == portainer.ErrObjectNotFound && !settings.AllowVolumeBrowserForRegularUsers {
			return responseutils.WriteAccessDeniedResponse()
		} else if err != nil && err != portainer.ErrObjectNotFound {
			return nil, err
		}

		user, err := p.UserService.User(tokenData.ID)
		if err != nil {
			return nil, err
		}

		endpointResourceAccess := false
		_, ok := user.EndpointAuthorizations[p.EndpointIdentifier][portainer.EndpointResourcesAccess]
		if ok {
			endpointResourceAccess = true
		}

		teamMemberships, err := p.TeamMembershipService.TeamMembershipsByUserID(tokenData.ID)
		if err != nil {
			return nil, err
		}

		userTeamIDs := make([]portainer.TeamID, 0)
		for _, membership := range teamMemberships {
			userTeamIDs = append(userTeamIDs, membership.TeamID)
		}

		resourceControls, err := p.ResourceControlService.ResourceControls()
		if err != nil {
			return nil, err
		}

		resourceControl := portainer.GetResourceControlByResourceIDAndType(resourceID, portainer.VolumeResourceControl, resourceControls)
		if !endpointResourceAccess && (resourceControl == nil || !portainer.UserCanAccessResource(tokenData.ID, userTeamIDs, resourceControl)) {
			return responseutils.WriteAccessDeniedResponse()
		}
	}

	return p.executeDockerRequest(request)
}

// rewriteOperationWithLabelFiltering will create a new operation context with data that will be used
// to decorate the original request's response as well as retrieve all the black listed labels
// to filter the resources.
func (p *ProxyTransport) rewriteOperationWithLabelFiltering(request *http.Request, operation restrictedOperationRequest) (*http.Response, error) {
	operationContext, err := p.createOperationContext(request)
	if err != nil {
		return nil, err
	}

	settings, err := p.SettingsService.Settings()
	if err != nil {
		return nil, err
	}

	executor := &operationExecutor{
		operationContext: operationContext,
		labelBlackList:   settings.BlackListedLabels,
	}

	return p.executeRequestAndRewriteResponse(request, operation, executor)
}

// rewriteOperation will create a new operation context with data that will be used
// to decorate the original request's response.
func (p *ProxyTransport) rewriteOperation(request *http.Request, operation restrictedOperationRequest) (*http.Response, error) {
	operationContext, err := p.createOperationContext(request)
	if err != nil {
		return nil, err
	}

	executor := &operationExecutor{
		operationContext: operationContext,
	}

	return p.executeRequestAndRewriteResponse(request, operation, executor)
}

func (p *ProxyTransport) interceptAndRewriteRequest(request *http.Request, operation operationRequest) (*http.Response, error) {
	err := operation(request)
	if err != nil {
		return nil, err
	}

	return p.executeDockerRequest(request)
}

// decorateGenericResourceCreationResponse extracts the response as a JSON object, extracts the resource identifier from that object based
// on the resourceIdentifierAttribute parameter then generate a new resource control associated to that resource
// with a random token and rewrites the response by decorating the original response with a ResourceControl object.
// The generic Docker API response format is JSON object:
// https://docs.docker.com/engine/api/v1.40/#operation/ContainerCreate
// https://docs.docker.com/engine/api/v1.40/#operation/NetworkCreate
// https://docs.docker.com/engine/api/v1.40/#operation/VolumeCreate
// https://docs.docker.com/engine/api/v1.40/#operation/ServiceCreate
// https://docs.docker.com/engine/api/v1.40/#operation/SecretCreate
// https://docs.docker.com/engine/api/v1.40/#operation/ConfigCreate
func (p *ProxyTransport) decorateGenericResourceCreationResponse(response *http.Response, resourceIdentifierAttribute string, resourceType portainer.ResourceControlType, userID portainer.UserID) error {
	responseObject, err := responseutils.GetResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[resourceIdentifierAttribute] == nil {
		log.Printf("[ERROR] [proxy,docker]")
		return errors.New("missing identifier in Docker resource creation response")
	}

	resourceID := responseObject[resourceIdentifierAttribute].(string)

	resourceControl, err := p.createPrivateResourceControl(resourceID, resourceType, userID)
	if err != nil {
		return err
	}

	responseObject = decorateObject(responseObject, resourceControl)

	return responseutils.RewriteResponse(response, responseObject, http.StatusOK)
}

func (p *ProxyTransport) decorateGenericResourceCreationOperation(request *http.Request, resourceIdentifierAttribute string, resourceType portainer.ResourceControlType) (*http.Response, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	response, err := p.executeDockerRequest(request)
	if err != nil {
		return response, err
	}

	err = p.decorateGenericResourceCreationResponse(response, resourceIdentifierAttribute, resourceType, tokenData.ID)
	return response, err
}

func (p *ProxyTransport) executeGenericResourceDeletionOperation(request *http.Request, resourceIdentifierAttribute string, resourceType portainer.ResourceControlType) (*http.Response, error) {
	response, err := p.restrictedOperation(request, resourceIdentifierAttribute, resourceType)
	if err != nil {
		return response, err
	}

	resourceControl, err := p.ResourceControlService.ResourceControlByResourceIDAndType(resourceIdentifierAttribute, resourceType)
	if err != nil {
		return response, err
	}

	if resourceControl != nil {
		err = p.ResourceControlService.DeleteResourceControl(resourceControl.ID)
		if err != nil {
			return response, err
		}
	}

	return response, err
}

func (p *ProxyTransport) executeRequestAndRewriteResponse(request *http.Request, operation restrictedOperationRequest, executor *operationExecutor) (*http.Response, error) {
	response, err := p.executeDockerRequest(request)
	if err != nil {
		return response, err
	}

	err = operation(response, executor)
	return response, err
}

// administratorOperation ensures that the user has administrator privileges
// before executing the original request.
func (p *ProxyTransport) administratorOperation(request *http.Request) (*http.Response, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	if tokenData.Role != portainer.AdministratorRole {
		return responseutils.WriteAccessDeniedResponse()
	}

	return p.executeDockerRequest(request)
}

func (p *ProxyTransport) createRegistryAccessContext(request *http.Request) (*registryAccessContext, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	accessContext := &registryAccessContext{
		isAdmin: true,
		userID:  tokenData.ID,
	}

	hub, err := p.DockerHubService.DockerHub()
	if err != nil {
		return nil, err
	}
	accessContext.dockerHub = hub

	registries, err := p.RegistryService.Registries()
	if err != nil {
		return nil, err
	}
	accessContext.registries = registries

	if tokenData.Role != portainer.AdministratorRole {
		accessContext.isAdmin = false

		teamMemberships, err := p.TeamMembershipService.TeamMembershipsByUserID(tokenData.ID)
		if err != nil {
			return nil, err
		}

		accessContext.teamMemberships = teamMemberships
	}

	return accessContext, nil
}

func (p *ProxyTransport) createOperationContext(request *http.Request) (*restrictedDockerOperationContext, error) {
	var err error
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	resourceControls, err := p.ResourceControlService.ResourceControls()
	if err != nil {
		return nil, err
	}

	operationContext := &restrictedDockerOperationContext{
		isAdmin:                true,
		userID:                 tokenData.ID,
		resourceControls:       resourceControls,
		endpointResourceAccess: false,
	}

	if tokenData.Role != portainer.AdministratorRole {
		operationContext.isAdmin = false

		user, err := p.UserService.User(operationContext.userID)
		if err != nil {
			return nil, err
		}

		_, ok := user.EndpointAuthorizations[p.EndpointIdentifier][portainer.EndpointResourcesAccess]
		if ok {
			operationContext.endpointResourceAccess = true
		}

		teamMemberships, err := p.TeamMembershipService.TeamMembershipsByUserID(tokenData.ID)
		if err != nil {
			return nil, err
		}

		userTeamIDs := make([]portainer.TeamID, 0)
		for _, membership := range teamMemberships {
			userTeamIDs = append(userTeamIDs, membership.TeamID)
		}
		operationContext.userTeamIDs = userTeamIDs
	}

	return operationContext, nil
}
