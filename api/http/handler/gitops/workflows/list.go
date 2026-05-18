package workflows

import (
	"cmp"
	"context"
	"net/http"
	"slices"
	"strconv"
	"strings"

	gocache "github.com/patrickmn/go-cache"
	portainer "github.com/portainer/portainer/api"
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
// @description Returns a unified list of all stacks that have GitOps (GitConfig) configured.
// @description **Access policy**: authenticated
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param search      query string  false "Search term (matches name or repository URL)"
// @param sort        query string  false "Sort field: name | type | status | creationDate | lastSyncDate"
// @param order       query string  false "Sort order: asc or desc"
// @param start       query int     false "Pagination start index"
// @param limit       query int     false "Pagination limit (0 = unlimited)"
// @param endpointIds query []int   false "Filter by environment IDs (e.g. endpointIds[]=1&endpointIds[]=2)"
// @param status      query string  false "Filter by status: healthy | syncing | error | paused | unknown"
// @param type        query string  false "Filter by type: stack"
// @param platform    query string  false "Filter by platform: dockerStandalone | dockerSwarm | kubernetes"
// @success 200 {array} svc.Workflow
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

	key := cacheKey(securityContext, endpointIDs)

	items, err := h.getWorkflows(r.Context(), key, securityContext, endpointIDs)
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
		items = slicesx.FilterInPlace(items, func(i svc.Workflow) bool { return i.Type == t })
	}

	if platform, _ := request.RetrieveQueryParameter(r, "platform", true); platform != "" {
		p, err := svc.ParsePlatform(platform)
		if err != nil {
			return httperror.BadRequest("Invalid platform parameter", err)
		}
		items = slicesx.FilterInPlace(items, func(i svc.Workflow) bool { return i.Platform == p })
	}

	results := filters.SearchOrderAndPaginate(items, params, filters.Config[svc.Workflow]{
		SearchAccessors: []filters.SearchAccessor[svc.Workflow]{
			func(i svc.Workflow) (string, error) { return i.Name, nil },
			func(i svc.Workflow) (string, error) {
				if i.GitConfig == nil {
					return "", nil
				}
				return i.GitConfig.URL, nil
			},
		},
		SortBindings: []filters.SortBinding[svc.Workflow]{
			{Key: "name", Fn: func(a, b svc.Workflow) int { return strings.Compare(a.Name, b.Name) }},
			{Key: "type", Fn: func(a, b svc.Workflow) int { return strings.Compare(string(a.Type), string(b.Type)) }},
			{Key: "status", Fn: func(a, b svc.Workflow) int {
				return strings.Compare(string(svc.EffectiveStatus(a)), string(svc.EffectiveStatus(b)))
			}},
			{Key: "creationDate", Fn: func(a, b svc.Workflow) int { return cmp.Compare(a.CreationDate, b.CreationDate) }},
			{Key: "lastSyncDate", Fn: func(a, b svc.Workflow) int { return cmp.Compare(a.LastSyncDate, b.LastSyncDate) }, NullsLast: func(i svc.Workflow) bool { return i.LastSyncDate == 0 }},
			{Key: "platform", Fn: func(a, b svc.Workflow) int { return strings.Compare(string(a.Platform), string(b.Platform)) }},
		},
	})

	filters.ApplyFilterResultsHeaders(&w, results)
	return response.JSON(w, redactWorkflowCredentials(results.Items))
}

func redactWorkflowCredentials(items []svc.Workflow) []svc.Workflow {
	for i := range items {
		if items[i].GitConfig != nil && items[i].GitConfig.Authentication != nil {
			gc := *items[i].GitConfig
			auth := *gc.Authentication
			auth.Password = ""
			gc.Authentication = &auth
			items[i].GitConfig = &gc
		}
	}
	return items
}

func (h *Handler) getWorkflows(ctx context.Context, key string, sc *security.RestrictedRequestContext, endpointIDs []portainer.EndpointID) ([]svc.Workflow, error) {
	if cached, ok := h.cache.Get(key); ok {
		return slices.Clone(cached.([]svc.Workflow)), nil
	}

	result, err := h.fetchWorkflows(ctx, sc, set.ToSet(endpointIDs))
	if err != nil {
		return nil, err
	}
	h.cache.Set(key, result, gocache.DefaultExpiration)
	return slices.Clone(result), nil
}

func (h *Handler) fetchWorkflows(ctx context.Context, sc *security.RestrictedRequestContext, endpointIDSet set.Set[portainer.EndpointID]) ([]svc.Workflow, error) {
	return svc.FetchWorkflows(ctx, h.dataStore, h.gitService, h.k8sFactory, sc, endpointIDSet)
}

func cacheKey(sc *security.RestrictedRequestContext, endpointIDs []portainer.EndpointID) string {
	ids := make([]string, len(endpointIDs))
	for i, id := range endpointIDs {
		ids[i] = strconv.Itoa(int(id))
	}
	slices.Sort(ids)

	teamIDs := make([]string, len(sc.UserMemberships))
	for i, membership := range sc.UserMemberships {
		teamIDs[i] = strconv.Itoa(int(membership.TeamID))
	}
	slices.Sort(teamIDs)

	return strconv.Itoa(int(sc.UserID)) + ":" + strconv.FormatBool(sc.IsAdmin) + ":" + strings.Join(ids, ",") + ":" + strings.Join(teamIDs, ",")
}
