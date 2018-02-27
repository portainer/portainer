package proxy

import (
	"net/http"
	"path"
	"strings"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/security"
)

type (
	proxyTransport struct {
		dockerTransport        *http.Transport
		ResourceControlService portainer.ResourceControlService
		TeamMembershipService  portainer.TeamMembershipService
		SettingsService        portainer.SettingsService
	}
	restrictedOperationContext struct {
		isAdmin          bool
		userID           portainer.UserID
		userTeamIDs      []portainer.TeamID
		resourceControls []portainer.ResourceControl
	}
	operationExecutor struct {
		operationContext *restrictedOperationContext
		labelBlackList   []portainer.Pair
	}
	restrictedOperationRequest func(*http.Request, *http.Response, *operationExecutor) error
	operationRequest           func(*http.Request) error
)

func (p *proxyTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	return p.proxyDockerRequest(request)
}

func (p *proxyTransport) executeDockerRequest(request *http.Request) (*http.Response, error) {
	return p.dockerTransport.RoundTrip(request)
}

func (p *proxyTransport) proxyDockerRequest(request *http.Request) (*http.Response, error) {
	path := request.URL.Path

	switch {
	case strings.HasPrefix(path, "/configs"):
		return p.proxyConfigRequest(request)
	case strings.HasPrefix(path, "/containers"):
		return p.proxyContainerRequest(request)
	case strings.HasPrefix(path, "/services"):
		return p.proxyServiceRequest(request)
	case strings.HasPrefix(path, "/volumes"):
		return p.proxyVolumeRequest(request)
	case strings.HasPrefix(path, "/networks"):
		return p.proxyNetworkRequest(request)
	case strings.HasPrefix(path, "/secrets"):
		return p.proxySecretRequest(request)
	case strings.HasPrefix(path, "/swarm"):
		return p.proxySwarmRequest(request)
	case strings.HasPrefix(path, "/nodes"):
		return p.proxyNodeRequest(request)
	case strings.HasPrefix(path, "/tasks"):
		return p.proxyTaskRequest(request)
	case strings.HasPrefix(path, "/build"):
		return p.proxyBuildRequest(request)
	default:
		return p.executeDockerRequest(request)
	}
}

func (p *proxyTransport) proxyConfigRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/configs/create":
		return p.executeDockerRequest(request)

	case "/configs":
		return p.rewriteOperation(request, configListOperation)

	default:
		// assume /configs/{id}
		if request.Method == http.MethodGet {
			return p.rewriteOperation(request, configInspectOperation)
		}
		configID := path.Base(requestPath)
		return p.restrictedOperation(request, configID)
	}
}

func (p *proxyTransport) proxyContainerRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/containers/create":
		return p.executeDockerRequest(request)

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
			return p.restrictedOperation(request, containerID)
		} else if match, _ := path.Match("/containers/*", requestPath); match {
			// Handle /containers/{id} requests
			containerID := path.Base(requestPath)
			return p.restrictedOperation(request, containerID)
		}
		return p.executeDockerRequest(request)
	}
}

func (p *proxyTransport) proxyServiceRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/services/create":
		return p.executeDockerRequest(request)

	case "/services":
		return p.rewriteOperation(request, serviceListOperation)

	default:
		// This section assumes /services/**
		if match, _ := path.Match("/services/*/*", requestPath); match {
			// Handle /services/{id}/{action} requests
			serviceID := path.Base(path.Dir(requestPath))
			return p.restrictedOperation(request, serviceID)
		} else if match, _ := path.Match("/services/*", requestPath); match {
			// Handle /services/{id} requests
			serviceID := path.Base(requestPath)

			if request.Method == http.MethodGet {
				return p.rewriteOperation(request, serviceInspectOperation)
			}
			return p.restrictedOperation(request, serviceID)
		}
		return p.executeDockerRequest(request)
	}
}

func (p *proxyTransport) proxyVolumeRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/volumes/create":
		return p.executeDockerRequest(request)

	case "/volumes/prune":
		return p.administratorOperation(request)

	case "/volumes":
		return p.rewriteOperation(request, volumeListOperation)

	default:
		// assume /volumes/{name}
		if request.Method == http.MethodGet {
			return p.rewriteOperation(request, volumeInspectOperation)
		}
		volumeID := path.Base(requestPath)
		return p.restrictedOperation(request, volumeID)
	}
}

func (p *proxyTransport) proxyNetworkRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/networks/create":
		return p.executeDockerRequest(request)

	case "/networks":
		return p.rewriteOperation(request, networkListOperation)

	default:
		// assume /networks/{id}
		if request.Method == http.MethodGet {
			return p.rewriteOperation(request, networkInspectOperation)
		}
		networkID := path.Base(requestPath)
		return p.restrictedOperation(request, networkID)
	}
}

func (p *proxyTransport) proxySecretRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/secrets/create":
		return p.executeDockerRequest(request)

	case "/secrets":
		return p.rewriteOperation(request, secretListOperation)

	default:
		// assume /secrets/{id}
		if request.Method == http.MethodGet {
			return p.rewriteOperation(request, secretInspectOperation)
		}
		secretID := path.Base(requestPath)
		return p.restrictedOperation(request, secretID)
	}
}

func (p *proxyTransport) proxyNodeRequest(request *http.Request) (*http.Response, error) {
	requestPath := request.URL.Path

	// assume /nodes/{id}
	if path.Base(requestPath) != "nodes" {
		return p.administratorOperation(request)
	}

	return p.executeDockerRequest(request)
}

func (p *proxyTransport) proxySwarmRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/swarm":
		return p.executeDockerRequest(request)
	default:
		// assume /swarm/{action}
		return p.administratorOperation(request)
	}
}

func (p *proxyTransport) proxyTaskRequest(request *http.Request) (*http.Response, error) {
	switch requestPath := request.URL.Path; requestPath {
	case "/tasks":
		return p.rewriteOperation(request, taskListOperation)
	default:
		// assume /tasks/{id}
		return p.executeDockerRequest(request)
	}
}

func (p *proxyTransport) proxyBuildRequest(request *http.Request) (*http.Response, error) {
	return p.interceptAndRewriteRequest(request, buildOperation)
}

// restrictedOperation ensures that the current user has the required authorizations
// before executing the original request.
func (p *proxyTransport) restrictedOperation(request *http.Request, resourceID string) (*http.Response, error) {
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

		resourceControl := getResourceControlByResourceID(resourceID, resourceControls)
		if resourceControl != nil && !canUserAccessResource(tokenData.ID, userTeamIDs, resourceControl) {
			return writeAccessDeniedResponse()
		}
	}

	return p.executeDockerRequest(request)
}

// rewriteOperation will create a new operation context with data that will be used
// to decorate the original request's response as well as retrieve all the black listed labels
// to filter the resources.
func (p *proxyTransport) rewriteOperationWithLabelFiltering(request *http.Request, operation restrictedOperationRequest) (*http.Response, error) {
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
func (p *proxyTransport) rewriteOperation(request *http.Request, operation restrictedOperationRequest) (*http.Response, error) {
	operationContext, err := p.createOperationContext(request)
	if err != nil {
		return nil, err
	}

	executor := &operationExecutor{
		operationContext: operationContext,
	}

	return p.executeRequestAndRewriteResponse(request, operation, executor)
}

func (p *proxyTransport) interceptAndRewriteRequest(request *http.Request, operation operationRequest) (*http.Response, error) {
	err := operation(request)
	if err != nil {
		return nil, err
	}

	return p.executeDockerRequest(request)
}

func (p *proxyTransport) executeRequestAndRewriteResponse(request *http.Request, operation restrictedOperationRequest, executor *operationExecutor) (*http.Response, error) {
	response, err := p.executeDockerRequest(request)
	if err != nil {
		return response, err
	}

	err = operation(request, response, executor)
	return response, err
}

// administratorOperation ensures that the user has administrator privileges
// before executing the original request.
func (p *proxyTransport) administratorOperation(request *http.Request) (*http.Response, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	if tokenData.Role != portainer.AdministratorRole {
		return writeAccessDeniedResponse()
	}

	return p.executeDockerRequest(request)
}

func (p *proxyTransport) createOperationContext(request *http.Request) (*restrictedOperationContext, error) {
	var err error
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	resourceControls, err := p.ResourceControlService.ResourceControls()
	if err != nil {
		return nil, err
	}

	operationContext := &restrictedOperationContext{
		isAdmin:          true,
		userID:           tokenData.ID,
		resourceControls: resourceControls,
	}

	if tokenData.Role != portainer.AdministratorRole {
		operationContext.isAdmin = false

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
