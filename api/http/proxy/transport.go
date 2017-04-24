package proxy

import (
	"net/http"
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

	if tokenData.Role == portainer.AdministratorRole {
		err = proxyAdministratorVolumeRequests(request, response, volumeResourceControls)
	} else {
		err = proxyUserVolumeRequests(request, response, tokenData.ID, userTeamIDs, volumeResourceControls)
	}

	if err != nil {
		return err
	}

	return nil
}
