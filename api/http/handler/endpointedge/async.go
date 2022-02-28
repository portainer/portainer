package endpointedge

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/sirupsen/logrus"
)

// https://datatracker.ietf.org/doc/html/rfc6902
// Doing this manually, because at this point, i don't want to marshal to json, make a diff - for now, just using 'add' (as its really an upsert)
type JSONPatch struct {
	Operation string      `json:"op"`
	Path      string      `json:"path"`
	Value     interface{} `json:"value"`
}

// TODO: copied from edgestack_status_update
type updateStatusPayload struct {
	Error      string
	Status     *portainer.EdgeStackStatusType
	EndpointID *portainer.EndpointID
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

// An empty request ~~ just a ping.
type Snapshot struct {
	Docker     *portainer.DockerSnapshot
	Kubernetes *portainer.KubernetesSnapshot
}
type AsyncRequest struct {
	CommandId   string    `json: optional`
	Snapshot    *Snapshot `json: optional` // todo
	StackStatus map[portainer.EdgeStackID]updateStatusPayload
}

func (payload *AsyncRequest) Validate(r *http.Request) error {
	// TODO:

	return nil
}

type AsyncResponse struct {
	CommandInterval  time.Duration `json: optional`
	PingInterval     time.Duration `json: optional`
	SnapshotInterval time.Duration `json: optional`

	ServerCommandId      string      // should be easy to detect if its larger / smaller:  this is the response that tells the agent there are new commands waiting for it
	SendDiffSnapshotTime time.Time   `json: optional` // might be optional
	Commands             []JSONPatch `json: optional` // todo
}

// for testing with mTLS..:
//sven@p1:~/src/portainer/portainer$ curl -k --cacert ~/.config/portainer/certs/ca.pem --cert ~/.config/portainer/certs/agent-cert.pem --key ~/.config/portainer/certs/agent-key.pem -X POST --header "X-PortainerAgent-EdgeID: 7e2b0143-c511-43c3-844c-a7a91ab0bedc" --data '{"CommandId": "okok", "Snapshot": {}}'  https://p1:9443/api/endpoints/edge/async/
//{"CommandInterval":0,"PingInterval":0,"SnapshotInterval":0,"ServerCommandId":"8888","SendDiffSnapshotTime":"0001-01-01T00:00:00Z","Commands":{}}

// @id endpointAsync
// @summary Get environment(endpoint) status
// @description Environment(Endpoint) for edge agent to check status of environment(endpoint)
// @description **Access policy**: restricted only to Edge environments(endpoints) TODO: with mTLS cert....
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {object} AsyncResponse "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access environment(endpoint)"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /endpoints/edge/async/ [post]
func (handler *Handler) endpointAsync(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	// TODO: get endpointID from the mTLS cert info
	edgeIdentifier := r.Header.Get(portainer.PortainerAgentEdgeIDHeader)
	if edgeIdentifier == "" {
		logrus.WithField("portainer.PortainerAgentEdgeIDHeader", edgeIdentifier).Debug("missing agent edge id")

		return &httperror.HandlerError{http.StatusInternalServerError, "missing Edge identifier", errors.New("missing Edge identifier")}
	}

	// TODO: if the mTLS certs are valid, and we don't have a matching environment registered, CREATE IT (and maybe untrusted...)
	endpoint, err := handler.getEdgeEndpoint(edgeIdentifier)
	if err != nil {
		// TODO: if its a valid cert, or the user hasn't limited to mTLS / portainer set id, the
		// create new untrusted environment
		// portainer.HTTPResponseAgentPlatform tells us what platform it is too...
		logrus.WithField("portainer.PortainerAgentEdgeIDHeader", edgeIdentifier).Debug("edge id not found in existing endpoints!")
	}
	// if agent mTLS is on, drop the connection if the client cert isn't CA'd (or if its revoked)
	err = handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access environment", err}
	}

	// Any request we can identify as coming from a valid agent is treated as a Ping
	endpoint.LastCheckInDate = time.Now().Unix()
	endpoint.Status = portainer.EndpointStatusUp
	err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to Unable to persist environment changes inside the database", err}
	}

	var payload AsyncRequest
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		// an "" request ~~ same as {}
		logrus.WithError(err).WithField("payload", r).Debug("decode payload")
	}

	asyncResponse := AsyncResponse{
		ServerCommandId: "8888", // the most current id of a new command on the server
	}

	// TODO: need a way to detect that these are changed, and send them to the agent...
	// CommandInterval time.Duration `json: optional`
	// PingInterval  time.Duration `json: optional`
	// SnapshotInterval time.Duration `json: optional`

	if payload.CommandId == "" && payload.Snapshot == nil {
		// just a ping.
		return response.JSON(w, asyncResponse)
	}

	if payload.Snapshot != nil {
		asyncResponse.SendDiffSnapshotTime = handler.saveSnapshot(endpoint, payload)
	}
	if payload.CommandId != "" {
		asyncResponse.Commands = handler.sendCommandsSince(endpoint, payload.CommandId)
	}

	return response.JSON(w, asyncResponse)
}

// TODO: yup, next step is for these to be JSONDiff's and to be rehydrated
func (handler *Handler) saveSnapshot(endpoint *portainer.Endpoint, payload AsyncRequest) time.Time {
	for stackID, status := range payload.StackStatus {
		stack, err := handler.DataStore.EdgeStack().EdgeStack(portainer.EdgeStackID(stackID))
		// TODO: work out what we can do with the errors
		if err == nil {
			stack.Status[*status.EndpointID] = portainer.EdgeStackStatus{
				Type:       *status.Status,
				Error:      status.Error,
				EndpointID: *status.EndpointID,
			}
			err = handler.DataStore.EdgeStack().UpdateEdgeStack(stack.ID, stack)
		}
	}

	switch endpoint.Type {
	// case portainer.AzureEnvironment:
	// 	return time.Now()
	case portainer.KubernetesLocalEnvironment, portainer.AgentOnKubernetesEnvironment, portainer.EdgeAgentOnKubernetesEnvironment:
		logrus.Debug("Got a Kubernetes Snapshot")
		endpoint.Kubernetes.Snapshots = []portainer.KubernetesSnapshot{*payload.Snapshot.Kubernetes}
		return time.Unix(payload.Snapshot.Kubernetes.Time, 0)
	case portainer.DockerEnvironment, portainer.AgentOnDockerEnvironment, portainer.EdgeAgentOnDockerEnvironment:
		logrus.Debug("Got a Docker Snapshot")
		endpoint.Snapshots = []portainer.DockerSnapshot{*payload.Snapshot.Docker}
		return time.Unix(payload.Snapshot.Docker.Time, 0)
	default:
		return time.Time{}
	}
}

func (handler *Handler) sendCommandsSince(endpoint *portainer.Endpoint, commandId string) []JSONPatch {
	var commandList []JSONPatch

	// TODO: later, figure out if it is scalable to do diff's, as it means the server needs to store what it sent to all million agents (if the database had time based versioning, this would be trivial...)
	//       I suspect the easiest thing will be to add a "modified timestamp" to edge stacks and edge jobs, and to send them only when the modified time > requested time
	logrus.WithField("endpoint", endpoint.Name).WithField("from command", commandId).Debug("Sending commands")

	// schedules := []edgeJobResponse{}
	tunnel := handler.ReverseTunnelService.GetTunnelDetails(endpoint.ID)
	for _, job := range tunnel.Jobs {
		schedule := edgeJobResponse{
			ID:             job.ID,
			CronExpression: job.CronExpression,
			CollectLogs:    job.Endpoints[endpoint.ID].CollectLogs,
			Version:        job.Version,
		}

		file, err := handler.FileService.GetFileContent("/", job.ScriptPath)
		if err != nil {
			// TODO: this should maybe just skip thi job?
			logrus.WithError(err).Error("Unable to retrieve Edge job script file")
			continue
		}

		schedule.Script = base64.RawStdEncoding.EncodeToString(file)
		cmd := JSONPatch{
			Operation: "add",
			Path:      fmt.Sprintf("/edgejob/%d", schedule.ID),
			Value:     schedule,
		}
		commandList = append(commandList, cmd)
	}

	relation, err := handler.DataStore.EndpointRelation().EndpointRelation(endpoint.ID)
	if err != nil {
		logrus.WithError(err).Error("Unable to retrieve relation object from the database")
		return commandList
	}

	// TODO: this is the datatype the agent uses in the end
	type edgeStackData struct {
		ID               portainer.EdgeStackID
		Version          int
		StackFileContent string
		Name             string
	}

	for stackID := range relation.EdgeStacks {
		stack, err := handler.DataStore.EdgeStack().EdgeStack(stackID)
		if err != nil {
			logrus.WithError(err).Error("Unable to retrieve edge stack from the database")
			continue
		}

		edgeStack, err := handler.DataStore.EdgeStack().EdgeStack(portainer.EdgeStackID(stackID))
		if handler.DataStore.IsErrObjectNotFound(err) {
			logrus.WithError(err).Error("Unable to find an edge stack with the specified identifier inside the database")
			continue
		} else if err != nil {
			logrus.WithError(err).Error("Unable to find an edge stack with the specified identifier inside the database")
			continue
		}

		fileName := edgeStack.EntryPoint
		if endpointutils.IsDockerEndpoint(endpoint) {
			if fileName == "" {
				logrus.Error("Docker is not supported by this stack")
				continue
			}
		}

		if endpointutils.IsKubernetesEndpoint(endpoint) {
			fileName = edgeStack.ManifestPath

			if fileName == "" {
				logrus.Error("Kubernetes is not supported by this stack")
				continue
			}
		}

		stackFileContent, err := handler.FileService.GetFileContent(edgeStack.ProjectPath, fileName)
		if err != nil {
			logrus.WithError(err).Error("Unable to retrieve Compose file from disk")
			continue
		}

		stackStatus := edgeStackData{
			StackFileContent: string(stackFileContent),
			Name:             edgeStack.Name,
			ID:               stack.ID,
			Version:          stack.Version,
		}

		cmd := JSONPatch{
			Operation: "add",
			Path:      fmt.Sprintf("/edgestack/%d", stack.ID),
			Value:     stackStatus,
		}
		commandList = append(commandList, cmd)
	}
	return commandList
}

// TODO: this probably should be in the data layer.. (like, somewhere that depends dataservices/errors)
func (handler *Handler) getEdgeEndpoint(edgeIdentifier string) (*portainer.Endpoint, error) {
	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return nil, err
	}
	for _, endpoint := range endpoints {
		if endpoint.EdgeID == edgeIdentifier {
			return &endpoint, nil
		}
	}
	return nil, err
}
