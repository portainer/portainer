package endpoints

import (
	"encoding/base64"
	"errors"
	"net/http"
	"strconv"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
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

type endpointStatusInspectResponse struct {
	// Status represents the environment(endpoint) status
	Status string `json:"status" example:"REQUIRED"`
	// The tunnel port
	Port int `json:"port" example:"8732"`
	// List of requests for jobs to run on the environment(endpoint)
	Schedules []edgeJobResponse `json:"schedules"`
	// The current value of CheckinInterval
	CheckinInterval int `json:"checkin" example:"5"`
	//
	Credentials string `json:"credentials" example:""`
	// List of stacks to be deployed on the environments(endpoints)
	Stacks []stackStatusResponse `json:"stacks"`
}

// @id EndpointStatusInspect
// @summary Get environment(endpoint) status
// @description Environment(Endpoint) for edge agent to check status of environment(endpoint)
// @description **Access policy**: restricted only to Edge environments(endpoints)
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {object} endpointStatusInspectResponse "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access environment(endpoint)"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /endpoints/{id}/status [get]
func (handler *Handler) endpointStatusInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an environment with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an environment with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access environment", err}
	}

	if endpoint.EdgeID == "" {
		edgeIdentifier := r.Header.Get(portainer.PortainerAgentEdgeIDHeader)
		endpoint.EdgeID = edgeIdentifier

		agentPlatformHeader := r.Header.Get(portainer.HTTPResponseAgentPlatform)
		if agentPlatformHeader == "" {
			return &httperror.HandlerError{http.StatusInternalServerError, "Agent Platform Header is missing", errors.New("Agent Platform Header is missing")}
		}

		agentPlatformNumber, err := strconv.Atoi(agentPlatformHeader)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to parse agent platform header", err}
		}

		agentPlatform := portainer.AgentPlatform(agentPlatformNumber)

		if agentPlatform == portainer.AgentPlatformDocker {
			endpoint.Type = portainer.EdgeAgentOnDockerEnvironment
		} else if agentPlatform == portainer.AgentPlatformKubernetes {
			endpoint.Type = portainer.EdgeAgentOnKubernetesEnvironment
		}
	}

	endpoint.LastCheckInDate = time.Now().Unix()

	err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to Unable to persist environment changes inside the database", err}
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	tunnel := handler.ReverseTunnelService.GetTunnelDetails(endpoint.ID)

	checkinInterval := settings.EdgeAgentCheckinInterval
	if endpoint.EdgeCheckinInterval != 0 {
		checkinInterval = endpoint.EdgeCheckinInterval
	}

	schedules := []edgeJobResponse{}
	for _, job := range tunnel.Jobs {
		schedule := edgeJobResponse{
			ID:             job.ID,
			CronExpression: job.CronExpression,
			CollectLogs:    job.Endpoints[endpoint.ID].CollectLogs,
			Version:        job.Version,
		}

		file, err := handler.FileService.GetFileContent("", job.ScriptPath)

		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve Edge job script file", err}
		}

		schedule.Script = base64.RawStdEncoding.EncodeToString(file)

		schedules = append(schedules, schedule)
	}

	statusResponse := endpointStatusInspectResponse{
		Status:          tunnel.Status,
		Port:            tunnel.Port,
		Schedules:       schedules,
		CheckinInterval: checkinInterval,
		Credentials:     tunnel.Credentials,
	}

	if tunnel.Status == portainer.EdgeAgentManagementRequired {
		handler.ReverseTunnelService.SetTunnelStatusToActive(endpoint.ID)
	}

	relation, err := handler.DataStore.EndpointRelation().EndpointRelation(endpoint.ID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve relation object from the database", err}
	}

	edgeStacksStatus := []stackStatusResponse{}
	for stackID := range relation.EdgeStacks {
		stack, err := handler.DataStore.EdgeStack().EdgeStack(stackID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge stack from the database", err}
		}

		stackStatus := stackStatusResponse{
			ID:      stack.ID,
			Version: stack.Version,
		}

		edgeStacksStatus = append(edgeStacksStatus, stackStatus)
	}

	statusResponse.Stacks = edgeStacksStatus

	return response.JSON(w, statusResponse)
}
