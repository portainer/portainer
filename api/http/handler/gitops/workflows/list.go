package workflows

import (
	"cmp"
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	svc "github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/http/utils/filters"
	"github.com/portainer/portainer/api/set"
	"github.com/portainer/portainer/api/slicesx"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GitOpsWorkflowsList
// @summary List all GitOps workflows
// @description Returns a list of GitOps workflows, each with its aggregated status and the artifacts it contains.
// @description **Access policy**: authenticated
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param search      query string  false "Search term (matches workflow name)"
// @param sort        query string  false "Sort field" Enums(name,status,creationDate,lastSyncDate)
// @param order       query string  false "Sort order" Enums(asc,desc)
// @param start       query int     false "Pagination start index"
// @param limit       query int     false "Pagination limit (0 = unlimited)"
// @param endpointIds query []int   false "Filter by environment IDs (e.g. endpointIds[]=1&endpointIds[]=2)"
// @param status      query string  false "Filter by status" Enums(healthy,syncing,error,paused,unknown)
// @param type        query string  false "Keep workflows that have at least one artifact of this type" Enums(stack)
// @param platform    query string  false "Keep workflows that have at least one artifact on this platform" Enums(dockerStandalone,dockerSwarm,kubernetes)
// @success 200 {array} svc.Workflow
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /gitops/workflows [get]
func (h *Handler) list(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	params := filters.ExtractListModifiersQueryParams(r)

	endpointIDs, err := request.RetrieveNumberArrayQueryParameter[portainer.EndpointID](r, "endpointIds")
	if err != nil {
		return httperror.BadRequest("Invalid endpointIds parameter", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	items, err := h.getWorkflows(securityContext, endpointIDs)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve workflows", err)
	}

	if status, _ := request.RetrieveQueryParameter(r, "status", true); status != "" {
		s, err := svc.ParseStatus(status)
		if err != nil {
			return httperror.BadRequest("Invalid status parameter", err)
		}
		items = slicesx.FilterInPlace(items, func(i svc.Workflow) bool { return svc.EffectiveStatus(i) == s })
	}

	if workflowType, _ := request.RetrieveQueryParameter(r, "type", true); workflowType != "" {
		t, err := svc.ParseType(workflowType)
		if err != nil {
			return httperror.BadRequest("Invalid type parameter", err)
		}
		items = slicesx.FilterInPlace(items, func(i svc.Workflow) bool {
			return hasArtifactMatching(i, func(a svc.ArtifactDetail) bool { return a.Type == t })
		})
	}

	if platform, _ := request.RetrieveQueryParameter(r, "platform", true); platform != "" {
		p, err := svc.ParsePlatform(platform)
		if err != nil {
			return httperror.BadRequest("Invalid platform parameter", err)
		}
		items = slicesx.FilterInPlace(items, func(i svc.Workflow) bool {
			return hasArtifactMatching(i, func(a svc.ArtifactDetail) bool { return a.Platform == p })
		})
	}

	results := filters.SearchOrderAndPaginate(items, params, filters.Config[svc.Workflow]{
		SearchAccessors: []filters.SearchAccessor[svc.Workflow]{
			func(i svc.Workflow) (string, error) { return i.Name, nil },
		},
		SortBindings: []filters.SortBinding[svc.Workflow]{
			{Key: "name", Fn: func(a, b svc.Workflow) int { return strings.Compare(a.Name, b.Name) }},
			{Key: "status", Fn: func(a, b svc.Workflow) int {
				return strings.Compare(string(svc.EffectiveStatus(a)), string(svc.EffectiveStatus(b)))
			}},
			{Key: "creationDate", Fn: func(a, b svc.Workflow) int { return cmp.Compare(a.CreationDate, b.CreationDate) }},
			{Key: "lastSyncDate", Fn: func(a, b svc.Workflow) int { return cmp.Compare(a.LastSyncDate, b.LastSyncDate) }, NullsLast: func(i svc.Workflow) bool { return i.LastSyncDate == 0 }},
		},
	})

	filters.ApplyFilterResultsHeaders(&w, results)
	return response.JSON(w, results.Items)
}

func hasArtifactMatching(w svc.Workflow, pred func(svc.ArtifactDetail) bool) bool {
	return slicesx.Some(w.Artifacts, pred)
}

func (h *Handler) getWorkflows(sc *security.RestrictedRequestContext, endpointIDs []portainer.EndpointID) ([]svc.Workflow, error) {
	var result []svc.Workflow
	err := h.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		result, err = svc.FetchWorkflows(tx, h.k8sFactory, sc, set.ToSet(endpointIDs))
		return err
	})
	if err != nil {
		return nil, err
	}

	return result, nil
}
