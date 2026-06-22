package sources

import (
	"context"
	"net/http"
	"slices"
	"strconv"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/http/utils/filters"
	"github.com/portainer/portainer/api/slicesx"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	gocache "github.com/patrickmn/go-cache"
)

// @id GitOpsSourcesList
// @summary List all GitOps sources
// @description Returns a deduplicated list of git repositories used across all GitOps workflows.
// @description **Access policy**: authenticated
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param search query string false "Search term (matches URL)"
// @param sort   query string false "Sort field: name | status | type"
// @param order  query string false "Sort order: asc or desc"
// @param start  query int    false "Pagination start index"
// @param limit  query int    false "Pagination limit (0 = unlimited)"
// @param status query string false "Filter by status: healthy | syncing | error | paused | unknown"
// @param type   query SourceType false "Filter by source type: git | oci | helm"
// @success 200 {array} Source
// @failure 400 "Invalid status parameter"
// @failure 403 "Access denied"
// @failure 500 "Server error"
// @router /gitops/sources [get]
func (h *Handler) list(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	params := filters.ExtractListModifiersQueryParams(r)

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	key := cacheKey(securityContext)

	sources, err := h.getSources(r.Context(), key, securityContext)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve sources", err)
	}

	if status, _ := request.RetrieveQueryParameter(r, "status", true); status != "" {
		s, err := workflows.ParseStatus(status)
		if err != nil {
			return httperror.BadRequest("Invalid status parameter", err)
		}
		sources = slicesx.FilterInPlace(sources, func(i Source) bool { return i.Status == s })
	}

	if sourceType, _ := request.RetrieveQueryParameter(r, "type", true); sourceType != "" {
		t, err := parseSourceType(sourceType)
		if err != nil {
			return httperror.BadRequest("Invalid type parameter", err)
		}
		sources = slicesx.FilterInPlace(sources, func(i Source) bool { return i.Type == t })
	}

	results := filters.SearchOrderAndPaginate(sources, params, filters.Config[Source]{
		SearchAccessors: []filters.SearchAccessor[Source]{
			func(s Source) (string, error) { return s.URL, nil },
		},
		SortBindings: []filters.SortBinding[Source]{
			{Key: "name", Fn: func(a, b Source) int { return strings.Compare(a.Name, b.Name) }},
			{Key: "status", Fn: func(a, b Source) int { return strings.Compare(string(a.Status), string(b.Status)) }},
			{Key: "type", Fn: func(a, b Source) int { return strings.Compare(string(a.Type), string(b.Type)) }},
		},
	})

	filters.ApplyFilterResultsHeaders(&w, results)
	return response.JSON(w, results.Items)
}

func (h *Handler) getSources(ctx context.Context, key string, sc *security.RestrictedRequestContext) ([]Source, error) {
	if cached, ok := h.cache.Get(key); ok {
		return slices.Clone(cached.([]Source)), nil
	}

	result, err := h.fetchSources(ctx, sc)
	if err != nil {
		return nil, err
	}
	h.cache.Set(key, result, gocache.DefaultExpiration)
	return slices.Clone(result), nil
}

func cacheKey(sc *security.RestrictedRequestContext) string {
	teamIDs := make([]string, len(sc.UserMemberships))
	for i, membership := range sc.UserMemberships {
		teamIDs[i] = strconv.Itoa(int(membership.TeamID))
	}
	slices.Sort(teamIDs)

	return strconv.Itoa(int(sc.UserID)) + ":" + strconv.FormatBool(sc.IsAdmin) + ":" + strings.Join(teamIDs, ",")
}

func (h *Handler) fetchSources(ctx context.Context, sc *security.RestrictedRequestContext) ([]Source, error) {
	var allSrcs []portainer.Source
	var stats map[portainer.SourceID]workflows.SourceStats

	if err := h.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		allSrcs, stats, err = workflows.FetchSourceStats(tx, h.k8sFactory, sc)
		return err
	}); err != nil {
		return nil, err
	}

	result := make([]Source, 0, len(allSrcs))
	for _, src := range allSrcs {
		stat, ok := stats[src.ID]
		if !ok {
			stat = workflows.SourceStats{}
		}

		result = append(result, h.buildSource(ctx, &src, stat))
	}

	return result, nil
}
