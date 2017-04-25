package proxy

import (
	"net/http"
	"path"
	"strings"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/context"
)

type (
	proxyTransport struct {
		transport              *http.Transport
		ResourceControlService portainer.ResourceControlService
		TeamService            portainer.TeamService
	}
)

func (p *proxyTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	response, err := p.transport.RoundTrip(req)
	if err != nil {
		return response, err
	}

	err = p.proxyDockerRequests(req, response)
	return response, err
}

func (p *proxyTransport) proxyDockerRequests(request *http.Request, response *http.Response) error {
	path := request.URL.Path

	if strings.HasPrefix(path, "/containers") {
		// return p.handleContainerRequests(request, response)
	} else if strings.HasPrefix(path, "/services") {
		// return p.handleServiceRequests(request, response)
	} else if strings.HasPrefix(path, "/volumes") {
		return p.proxyVolumeRequests(request, response)
	}

	return nil
}

func (p *proxyTransport) proxyVolumeRequests(request *http.Request, response *http.Response) error {
	tokenData, err := context.GetTokenData(request)
	if err != nil {
		return err
	}
	userID := tokenData.ID

	volumeResourceControls, err := p.ResourceControlService.ResourceControls(portainer.VolumeResourceControl)
	if err != nil {
		return err
	}

	userTeams, err := p.TeamService.TeamsByUserID(tokenData.ID)
	if err != nil {
		return err
	}

	userTeamIDs := make([]portainer.TeamID, 0)
	for _, team := range userTeams {
		userTeamIDs = append(userTeamIDs, team.ID)
	}

	switch requestPath := request.URL.Path; requestPath {
	case "/volumes/create":
		return nil

	case "/volumes/prune":
		if tokenData.Role != portainer.AdministratorRole {
			return writeAccessDeniedResponse(response)
		}

	case "/volumes":
		if tokenData.Role != portainer.AdministratorRole {
			// return filterVolumeListResponse(response, userID, userTeamIDs, volumeResourceControls)
		}
		// return decorateVolumeListResponse(response, volumeResourceControls)
	default:
		// assume /volumes/{name}
		// if tokenData.Role == portainer.AdministratorRole {
		// 	if request.Method == http.MethodGet {
		// 		// return decorateVolumeInspect(response, volumeResourceControls)
		// 	}
		// 	return nil
		// }

		if request.Method == http.MethodGet {
			proxyRequest := &proxyVolumeInspectRequest{
				userID:           tokenData.ID,
				userRole:         tokenData.Role,
				userTeamIDs:      userTeamIDs,
				resourceControls: volumeResourceControls,
			}
			return proxyRequest.decorateVolumeInspectResponse(response)
		}
		volumeID := path.Base(requestPath)
		if !isResourceAccessAuthorized(userID, userTeamIDs, volumeID, volumeResourceControls) {
			return writeAccessDeniedResponse(response)
		}
	}

	//
	// if tokenData.Role == portainer.AdministratorRole {
	// 	err = proxyAdministratorVolumeRequests(request, response, volumeResourceControls)
	// } else {
	//
	// 	err = proxyUserVolumeRequests(request, response, tokenData.ID, userTeamIDs, volumeResourceControls)
	// }
	// if err != nil {
	// 	return err
	// }

	return nil
}
