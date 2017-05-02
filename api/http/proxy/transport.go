package proxy

import (
	"net"
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
		// TeamService            portainer.TeamService
	}
	restrictedOperationContext struct {
		isAdmin          bool
		userID           portainer.UserID
		userTeamIDs      []portainer.TeamID
		resourceControls []portainer.ResourceControl
	}
	restrictedOperationRequest func(*http.Request, *http.Response, *restrictedOperationContext) error
)

func newSocketTransport(socketPath string) *http.Transport {
	return &http.Transport{
		Dial: func(proto, addr string) (conn net.Conn, err error) {
			return net.Dial("unix", socketPath)
		},
	}
}

func newHTTPTransport() *http.Transport {
	return &http.Transport{}
}

func (p *proxyTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	return p.proxyDockerRequest(request)
}

func (p *proxyTransport) executeDockerRequest(request *http.Request) (*http.Response, error) {
	return p.dockerTransport.RoundTrip(request)
}

func (p *proxyTransport) proxyDockerRequest(request *http.Request) (*http.Response, error) {
	path := request.URL.Path

	if strings.HasPrefix(path, "/containers") {
		return p.proxyContainerRequest(request)
	} else if strings.HasPrefix(path, "/services") {
		return p.proxyServiceRequest(request)
	} else if strings.HasPrefix(path, "/volumes") {
		return p.proxyVolumeRequest(request)
	}

	return p.executeDockerRequest(request)
}

func (p *proxyTransport) proxyContainerRequest(request *http.Request) (*http.Response, error) {
	return p.executeDockerRequest(request)
}

func (p *proxyTransport) proxyServiceRequest(request *http.Request) (*http.Response, error) {
	return p.executeDockerRequest(request)
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
		// userTeams, err := p.TeamService.TeamsByUserID(tokenData.ID)
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
// to decorate the original request's response.
func (p *proxyTransport) rewriteOperation(request *http.Request, operation restrictedOperationRequest) (*http.Response, error) {
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

		// userTeams, err := p.TeamService.TeamsByUserID(tokenData.ID)
		// if err != nil {
		// 	return nil, err
		// }

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

	response, err := p.executeDockerRequest(request)
	if err != nil {
		return response, err
	}

	err = operation(request, response, operationContext)
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
