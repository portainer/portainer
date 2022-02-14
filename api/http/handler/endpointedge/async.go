package endpointedge

import (
	"errors"
	"net/http"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

// And empty request ~~ just a ping.
type AsyncRequest struct {
	CommandId string      `json: optional`
	Snapshot  interface{} `json: optional` // todo
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
	Commands             interface{} `json: optional` // todo
}

// for testing:
// sven@p1:~/src/portainer/portainer$ curl -k -X POST --header "X-PortainerAgent-EdgeID: 7e2b0143-c511-43c3-844c-a7a91ab0bedc" --data '{"CommandId": "okok", "Snapshot": {}}'  https://p1:9443/api/endpoints/edge/async/
// {"CommandInterval":0,"PingInterval":0,"SnapshotInterval":0,"ServerCommandId":"8888","SendDiffSnapshotTime":"0001-01-01T00:00:00Z","Commands":{}}

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

	// Any request we can identify as coming from a valid agent is treated as a Ping
	endpoint.LastCheckInDate = time.Now().Unix()
	endpoint.Status = portainer.EndpointStatusUp
	err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to Unable to persist environment changes inside the database", err}
	}

	// TODO: update endpoint contact time

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
		asyncResponse.SendDiffSnapshotTime = saveSnapshot(endpoint, payload)
	}
	if payload.CommandId != "" {
		asyncResponse.Commands = sendCommandsSince(endpoint, payload.CommandId)
	}

	return response.JSON(w, asyncResponse)
}

// TODO: yup, next step is for these to be JSONDiff's and to be rehydrated
func saveSnapshot(endpoint *portainer.Endpoint, payload AsyncRequest) time.Time {
	switch endpoint.Type {
	// case portainer.AzureEnvironment:
	// 	return time.Now()
	// case portainer.KubernetesLocalEnvironment, portainer.AgentOnKubernetesEnvironment, portainer.EdgeAgentOnKubernetesEnvironment:
	// 	var ksnap portainer.KubernetesSnapshot
	// 	err := request.DecodeAndValidateJSONPayload(AsyncRequest.Snapshot, &ksnap)
	// 	if err != nil {
	// 		// an "" request ~~ same as {}
	// 		logrus.WithError(err).WithField("payload", r).Debug("decode payload")
	// 	}
	// 	endpoint.Kubernetes.Snapshots = []portainer.KubernetesSnapshot{ksnap}

	// 	return time.Unix(ksnap.Time, 0)
	case portainer.DockerEnvironment, portainer.AgentOnDockerEnvironment, portainer.EdgeAgentOnDockerEnvironment:
		logrus.Debug("Got a Docker Snapshot")
		dsnap, valid := payload.Snapshot.(portainer.DockerSnapshot)
		if !valid {
			// an "" request ~~ same as {}
			logrus.Error("snapshot isn't valid")
			return time.Time{}
		}
		endpoint.Snapshots = []portainer.DockerSnapshot{dsnap}
		return time.Unix(dsnap.Time, 0)
	}

	return time.Time{}
}

func sendCommandsSince(endpoint *portainer.Endpoint, commandId string) interface{} {
	// TODO: get a list of all stacks for this endpoint - endpointStatusInspect
	// TODO: start with being a rollup of all the endpointEdgeStackInspect for an endpoint
	// TODO: later, figure out if it is scalable to do diff's, as it means the server needs to store what it sent to all million agents (if the database had time based versioning, this would be trivial...)
	logrus.WithField("endpoint", endpoint.Name).WithField("from command", commandId).Debug("Sending commands")

	type jsonDiff struct{}

	return jsonDiff{}
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
