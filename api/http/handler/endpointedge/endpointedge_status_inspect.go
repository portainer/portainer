package endpointedge

import (
	"bytes"
	"encoding/base64"
	"errors"
	"fmt"
	"hash/fnv"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge/cache"
	"github.com/portainer/portainer/pkg/featureflags"
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
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid environment identifier route variable", err)
	}

	cachedResp := handler.respondFromCache(w, r, portainer.EndpointID(endpointID))
	if cachedResp {
		return nil
	}

	if _, ok := handler.DataStore.Endpoint().Heartbeat(portainer.EndpointID(endpointID)); !ok {
		// EE-5190
		return httperror.Forbidden("Permission denied to access environment", errors.New("the device has not been trusted yet"))
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err != nil {
		// EE-5190
		return httperror.Forbidden("Permission denied to access environment", errors.New("the device has not been trusted yet"))
	}

	err = handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint)
	if err != nil {
		return httperror.Forbidden("Permission denied to access environment", err)
	}

	handler.DataStore.Endpoint().UpdateHeartbeat(endpoint.ID)

	err = handler.requestBouncer.TrustedEdgeEnvironmentAccess(handler.DataStore, endpoint)
	if err != nil {
		return httperror.Forbidden("Permission denied to access environment", err)
	}

	var statusResponse *endpointEdgeStatusInspectResponse
	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		statusResponse, err = handler.inspectStatus(handler.DataStore, r, portainer.EndpointID(endpointID))
	} else {
		err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			statusResponse, err = handler.inspectStatus(tx, r, portainer.EndpointID(endpointID))
			return err
		})
	}

	if err != nil {
		var httpErr *httperror.HandlerError
		if errors.As(err, &httpErr) {
			return httpErr
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return cacheResponse(w, endpoint.ID, *statusResponse)
}

func (handler *Handler) inspectStatus(tx dataservices.DataStoreTx, r *http.Request, endpointID portainer.EndpointID) (*endpointEdgeStatusInspectResponse, error) {
	endpoint, err := tx.Endpoint().Endpoint(endpointID)
	if err != nil {
		return nil, err
	}

	if endpoint.EdgeID == "" {
		edgeIdentifier := r.Header.Get(portainer.PortainerAgentEdgeIDHeader)
		endpoint.EdgeID = edgeIdentifier
	}

	// Take an initial snapshot
	if endpoint.LastCheckInDate == 0 {
		handler.ReverseTunnelService.SetTunnelStatusToRequired(endpoint.ID)
	}

	agentPlatform, agentPlatformErr := parseAgentPlatform(r)
	if agentPlatformErr != nil {
		return nil, httperror.BadRequest("agent platform header is not valid", err)
	}
	endpoint.Type = agentPlatform

	version := r.Header.Get(portainer.PortainerAgentHeader)
	endpoint.Agent.Version = version

	endpoint.LastCheckInDate = time.Now().Unix()

	err = tx.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return nil, httperror.InternalServerError("Unable to persist environment changes inside the database", err)
	}

	checkinInterval := endpoint.EdgeCheckinInterval
	if endpoint.EdgeCheckinInterval == 0 {
		settings, err := tx.Settings().Settings()
		if err != nil {
			return nil, httperror.InternalServerError("Unable to retrieve settings from the database", err)
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
		return nil, handlerErr
	}
	statusResponse.Schedules = schedules

	if tunnel.Status == portainer.EdgeAgentManagementRequired {
		handler.ReverseTunnelService.SetTunnelStatusToActive(endpoint.ID)
	}

	edgeStacksStatus, handlerErr := handler.buildEdgeStacks(tx, endpoint.ID)
	if handlerErr != nil {
		return nil, handlerErr
	}
	statusResponse.Stacks = edgeStacksStatus

	return &statusResponse, nil
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
		var collectLogs bool
		if _, ok := job.GroupLogsCollection[endpointID]; ok {
			collectLogs = job.GroupLogsCollection[endpointID].CollectLogs
		} else {
			collectLogs = job.Endpoints[endpointID].CollectLogs
		}

		schedule := edgeJobResponse{
			ID:             job.ID,
			CronExpression: job.CronExpression,
			CollectLogs:    collectLogs,
			Version:        job.Version,
		}

		file, err := handler.FileService.GetFileContent(job.ScriptPath, "")
		if err != nil {
			return nil, httperror.InternalServerError("Unable to retrieve Edge job script file", err)
		}
		schedule.Script = base64.RawStdEncoding.EncodeToString(file)

		schedules = append(schedules, schedule)
	}

	return schedules, nil
}

func (handler *Handler) buildEdgeStacks(tx dataservices.DataStoreTx, endpointID portainer.EndpointID) ([]stackStatusResponse, *httperror.HandlerError) {
	relation, err := tx.EndpointRelation().EndpointRelation(endpointID)
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve relation object from the database", err)
	}

	edgeStacksStatus := []stackStatusResponse{}
	for stackID := range relation.EdgeStacks {
		version, ok := tx.EdgeStack().EdgeStackVersion(stackID)
		if !ok {
			return nil, httperror.InternalServerError("Unable to retrieve edge stack from the database", err)
		}

		stackStatus := stackStatusResponse{
			ID:      stackID,
			Version: version,
		}

		edgeStacksStatus = append(edgeStacksStatus, stackStatus)
	}

	return edgeStacksStatus, nil
}

func cacheResponse(w http.ResponseWriter, endpointID portainer.EndpointID, statusResponse endpointEdgeStatusInspectResponse) *httperror.HandlerError {
	rr := httptest.NewRecorder()

	httpErr := response.JSON(rr, statusResponse)
	if httpErr != nil {
		return httpErr
	}

	h := fnv.New32a()
	h.Write(rr.Body.Bytes())
	etag := strconv.FormatUint(uint64(h.Sum32()), 16)

	cache.Set(endpointID, []byte(etag))

	resp := rr.Result()

	for k, vs := range resp.Header {
		for _, v := range vs {
			w.Header().Add(k, v)
		}
	}

	w.Header().Set("ETag", etag)
	io.Copy(w, resp.Body)

	return nil
}

func (handler *Handler) respondFromCache(w http.ResponseWriter, r *http.Request, endpointID portainer.EndpointID) bool {
	inmHeader := r.Header.Get("If-None-Match")
	etags := strings.Split(inmHeader, ",")

	if len(inmHeader) == 0 || etags[0] == "" {
		return false
	}

	cachedETag, ok := cache.Get(endpointID)
	if !ok {
		return false
	}

	for _, etag := range etags {
		if !bytes.Equal([]byte(etag), cachedETag) {
			continue
		}

		handler.DataStore.Endpoint().UpdateHeartbeat(endpointID)

		w.Header().Set("ETag", etag)
		w.WriteHeader(http.StatusNotModified)

		return true
	}

	return false
}
