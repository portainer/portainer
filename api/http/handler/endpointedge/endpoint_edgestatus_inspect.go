package endpointedge

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/middlewares"
)

type stackStatusResponse struct {
	// EdgeStack Identifier
	ID portainer.EdgeStackID `example:"1"`
	// Version of this stack
	Version int `example:"3"`
}

type edgeJobResponse struct {
	// EdgeJob Identifier
	ID portainer.EdgeJobID `json:"Id" example:"2"`
	// Whether to collect logs
	CollectLogs bool `json:"CollectLogs" example:"true"`
	// A cron expression to schedule this job
	CronExpression string `json:"CronExpression" example:"* * * * *"`
	// Script to run
	Script string `json:"Script" example:"echo hello"`
	// Version of this EdgeJob
	Version int `json:"Version" example:"2"`
}

type endpointEdgeStatusInspectResponse struct {
	// Status represents the environment(endpoint) status
	Status string `json:"status" example:"REQUIRED"`
	// The tunnel port
	Port int `json:"port" example:"8732"`
	// List of requests for jobs to run on the environment(endpoint)
	Schedules []edgeJobResponse `json:"schedules"`
	// The current value of CheckinInterval
	CheckinInterval int `json:"checkin" example:"5"`
	//
	Credentials string `json:"credentials"`
	// List of stacks to be deployed on the environments(endpoints)
	Stacks []stackStatusResponse `json:"stacks"`
}

// @id EndpointEdgeStatusInspect
// @summary Get environment(endpoint) status
// @description environment(endpoint) for edge agent to check status of environment(endpoint)
// @description **Access policy**: restricted only to Edge environments(endpoints)
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {object} endpointEdgeStatusInspectResponse "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access environment(endpoint)"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /endpoints/{id}/edge/status [get]
func (handler *Handler) endpointEdgeStatusInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.BadRequest("Unable to find an environment on request context", err)
	}

	err = handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access environment", err}
	}

	if endpoint.EdgeID == "" {
		edgeIdentifier := r.Header.Get(portainer.PortainerAgentEdgeIDHeader)
		endpoint.EdgeID = edgeIdentifier

		agentPlatform, agentPlatformErr := parseAgentPlatform(r)
		if agentPlatformErr != nil {
			return httperror.BadRequest("agent platform header is not valid", err)
		}
		endpoint.Type = agentPlatform
	}

	endpoint.LastCheckInDate = time.Now().Unix()

	err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to Unable to persist environment changes inside the database", err}
	}

	checkinInterval := endpoint.EdgeCheckinInterval
	if endpoint.EdgeCheckinInterval == 0 {
		settings, err := handler.DataStore.Settings().Settings()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
		}
		checkinInterval = settings.EdgeAgentCheckinInterval
	}

	tunnel := handler.ReverseTunnelService.GetTunnelDetails(endpoint.ID)

	statusResponse := endpointEdgeStatusInspectResponse{
		Status:          tunnel.Status,
		Port:            tunnel.Port,
		CheckinInterval: checkinInterval,
		Credentials:     tunnel.Credentials,
	}

	schedules, handlerErr := handler.buildSchedules(endpoint.ID, tunnel)
	if handlerErr != nil {
		return handlerErr
	}
	statusResponse.Schedules = schedules

	if tunnel.Status == portainer.EdgeAgentManagementRequired {
		handler.ReverseTunnelService.SetTunnelStatusToActive(endpoint.ID)
	}

	edgeStacksStatus, handlerErr := handler.buildEdgeStacks(endpoint.ID)
	if handlerErr != nil {
		return handlerErr
	}
	statusResponse.Stacks = edgeStacksStatus

	return response.JSON(w, statusResponse)
}

func parseAgentPlatform(r *http.Request) (portainer.EndpointType, error) {
	agentPlatformHeader := r.Header.Get(portainer.HTTPResponseAgentPlatform)
	if agentPlatformHeader == "" {
		return 0, errors.New("agent platform header is missing")
	}

	agentPlatformNumber, err := strconv.Atoi(agentPlatformHeader)
	if err != nil {
		return 0, err
	}

	agentPlatform := portainer.AgentPlatform(agentPlatformNumber)

	switch agentPlatform {
	case portainer.AgentPlatformDocker:
		return portainer.EdgeAgentOnDockerEnvironment, nil
	case portainer.AgentPlatformKubernetes:
		return portainer.EdgeAgentOnKubernetesEnvironment, nil
	default:
		return 0, fmt.Errorf("agent platform %v is not valid", agentPlatform)
	}
}

func (handler *Handler) buildSchedules(endpointID portainer.EndpointID, tunnel portainer.TunnelDetails) ([]edgeJobResponse, *httperror.HandlerError) {
	schedules := []edgeJobResponse{}
	for _, job := range tunnel.Jobs {
		schedule := edgeJobResponse{
			ID:             job.ID,
			CronExpression: job.CronExpression,
			CollectLogs:    job.Endpoints[endpointID].CollectLogs,
			Version:        job.Version,
		}

		file, err := handler.FileService.GetFileContent(job.ScriptPath, "")
		if err != nil {
			return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve Edge job script file", err}
		}
		schedule.Script = base64.RawStdEncoding.EncodeToString(file)

		schedules = append(schedules, schedule)
	}
	return schedules, nil
}

func (handler *Handler) buildEdgeStacks(endpointID portainer.EndpointID) ([]stackStatusResponse, *httperror.HandlerError) {
	relation, err := handler.DataStore.EndpointRelation().EndpointRelation(endpointID)
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve relation object from the database", err}
	}

	edgeStacksStatus := []stackStatusResponse{}
	for stackID := range relation.EdgeStacks {
		stack, err := handler.DataStore.EdgeStack().EdgeStack(stackID)
		if err != nil {
			return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge stack from the database", err}
		}

		stackStatus := stackStatusResponse{
			ID:      stack.ID,
			Version: stack.Version,
		}

		edgeStacksStatus = append(edgeStacksStatus, stackStatus)
	}
	return edgeStacksStatus, nil
}
