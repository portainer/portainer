package edgestacks

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/slicesx"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type aggregatedStatusesMap map[portainer.EdgeStackStatusType]int

type SummarizedStatus string

const (
	sumStatusUnavailable      SummarizedStatus = "Unavailable"
	sumStatusDeploying        SummarizedStatus = "Deploying"
	sumStatusFailed           SummarizedStatus = "Failed"
	sumStatusPaused           SummarizedStatus = "Paused"
	sumStatusPartiallyRunning SummarizedStatus = "PartiallyRunning"
	sumStatusCompleted        SummarizedStatus = "Completed"
	sumStatusRunning          SummarizedStatus = "Running"
)

type edgeStackStatusSummary struct {
	AggregatedStatus aggregatedStatusesMap
	Status           SummarizedStatus
	Reason           string
}

type edgeStackListResponseItem struct {
	portainer.EdgeStack
	StatusSummary edgeStackStatusSummary
}

// @id EdgeStackList
// @summary Fetches the list of EdgeStacks
// @description **Access policy**: administrator
// @tags edge_stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param summarizeStatuses query boolean false "will summarize the statuses"
// @success 200 {array} portainer.EdgeStack
// @failure 500
// @failure 400
// @failure 503 "Edge compute features are disabled"
// @router /edge_stacks [get]
func (handler *Handler) edgeStackList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	summarizeStatuses, _ := request.RetrieveBooleanQueryParameter(r, "summarizeStatuses", true)

	edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge stacks from the database", err)
	}

	res := make([]edgeStackListResponseItem, len(edgeStacks))

	for i := range edgeStacks {
		res[i].EdgeStack = edgeStacks[i]

		if summarizeStatuses {
			if err := fillStatusSummary(handler.DataStore, &res[i]); err != nil {
				return handlerDBErr(err, "Unable to retrieve edge stack status from the database")
			}
		} else if err := fillEdgeStackStatus(handler.DataStore, &res[i].EdgeStack); err != nil {
			return handlerDBErr(err, "Unable to retrieve edge stack status from the database")
		}
	}

	return response.JSON(w, res)
}

func fillStatusSummary(tx dataservices.DataStoreTx, edgeStack *edgeStackListResponseItem) error {
	statuses, err := tx.EdgeStackStatus().ReadAll(edgeStack.ID)
	if err != nil {
		return err
	}

	aggregated := make(aggregatedStatusesMap)

	for _, envStatus := range statuses {
		for _, status := range envStatus.Status {
			aggregated[status.Type]++
		}
	}

	status, reason := SummarizeStatuses(statuses, edgeStack.NumDeployments)

	edgeStack.StatusSummary = edgeStackStatusSummary{
		AggregatedStatus: aggregated,
		Status:           status,
		Reason:           reason,
	}

	edgeStack.Status = map[portainer.EndpointID]portainer.EdgeStackStatus{}

	return nil
}

func SummarizeStatuses(statuses []portainer.EdgeStackStatusForEnv, numDeployments int) (SummarizedStatus, string) {
	if numDeployments == 0 {
		return sumStatusUnavailable, "Your edge stack is currently unavailable due to the absence of an available environment in your edge group"
	}

	allStatuses := slicesx.FlatMap(statuses, func(x portainer.EdgeStackStatusForEnv) []portainer.EdgeStackDeploymentStatus {
		return x.Status
	})

	lastStatuses := slicesx.Map(
		slicesx.Filter(
			statuses,
			func(s portainer.EdgeStackStatusForEnv) bool {
				return len(s.Status) > 0
			},
		),
		func(x portainer.EdgeStackStatusForEnv) portainer.EdgeStackDeploymentStatus {
			return x.Status[len(x.Status)-1]
		},
	)

	if len(lastStatuses) == 0 {
		return sumStatusDeploying, ""
	}

	if allFailed := slicesx.Every(lastStatuses, func(s portainer.EdgeStackDeploymentStatus) bool {
		return s.Type == portainer.EdgeStackStatusError
	}); allFailed {
		return sumStatusFailed, ""
	}

	if hasPaused := slicesx.Some(allStatuses, func(s portainer.EdgeStackDeploymentStatus) bool {
		return s.Type == portainer.EdgeStackStatusPausedDeploying
	}); hasPaused {
		return sumStatusPaused, ""
	}

	if len(lastStatuses) < numDeployments {
		return sumStatusDeploying, ""
	}

	hasDeploying := slicesx.Some(lastStatuses, func(s portainer.EdgeStackDeploymentStatus) bool { return s.Type == portainer.EdgeStackStatusDeploying })
	hasRunning := slicesx.Some(lastStatuses, func(s portainer.EdgeStackDeploymentStatus) bool { return s.Type == portainer.EdgeStackStatusRunning })
	hasFailed := slicesx.Some(lastStatuses, func(s portainer.EdgeStackDeploymentStatus) bool { return s.Type == portainer.EdgeStackStatusError })

	if hasRunning && hasFailed && !hasDeploying {
		return sumStatusPartiallyRunning, ""
	}

	if allCompleted := slicesx.Every(lastStatuses, func(s portainer.EdgeStackDeploymentStatus) bool { return s.Type == portainer.EdgeStackStatusCompleted }); allCompleted {
		return sumStatusCompleted, ""
	}

	if allRunning := slicesx.Every(lastStatuses, func(s portainer.EdgeStackDeploymentStatus) bool {
		return s.Type == portainer.EdgeStackStatusRunning
	}); allRunning {
		return sumStatusRunning, ""
	}

	return sumStatusDeploying, ""
}
