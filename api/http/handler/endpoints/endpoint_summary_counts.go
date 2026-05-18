package endpoints

import (
	"net/http"
	"sort"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/endpointutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"

	"golang.org/x/mod/semver"
)

type groupCount struct {
	GroupID   int    `json:"groupID"`
	GroupName string `json:"groupName"`
	Count     int    `json:"count"`
}

type platformCounts struct {
	Docker     int `json:"docker"`
	Kubernetes int `json:"kubernetes"`
	Azure      int `json:"azure"`
	Podman     int `json:"podman"`
}

type healthCounts struct {
	Down      int `json:"down"`
	Outdated  int `json:"outdated"`
	Up        int `json:"up"`
	Heartbeat int `json:"heartbeat"`
}

type EnvironmentSummaryCountsResponse struct {
	Total          int            `json:"total"`
	Up             int            `json:"up"`
	Down           int            `json:"down"`
	Outdated       int            `json:"outdated"`
	Unassigned     int            `json:"unassigned"`
	ByGroup        []groupCount   `json:"byGroup"`
	ByPlatformType platformCounts `json:"byPlatformType"`
	ByHealth       healthCounts   `json:"byHealth"`
}

const UnassignedGroupID = portainer.EndpointGroupID(1)

// @id EndpointSummaryCounts
// @summary Get environment summary counts
// @description Returns counts of environments by status (up, down) and ungrouped environments (unassigned), plus breakdowns by group, type, and health.
// @description **Access policy**: restricted
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {object} EnvironmentSummaryCountsResponse "Environment summary counts"
// @failure 500 "Server error"
// @router /endpoints/summary [get]
func (handler *Handler) endpointSummaryCounts(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var counts EnvironmentSummaryCountsResponse
	err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		endpointGroups, err := tx.EndpointGroup().ReadAll()
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve environment groups from the database", err)
		}

		endpoints, err := tx.Endpoint().Endpoints()
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve environments from the database", err)
		}

		settings, err := tx.Settings().Settings()
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve settings from the database", err)
		}

		securityContext, err := security.RetrieveRestrictedRequestContext(r)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve info from request context", err)
		}

		filteredEndpoints := security.FilterEndpoints(endpoints, endpointGroups, securityContext)

		// Filter out untrusted edge endpoints to match the environment list behavior
		trustedEndpoints := make([]portainer.Endpoint, 0, len(filteredEndpoints))
		for i := range filteredEndpoints {
			ep := &filteredEndpoints[i]
			if endpointutils.IsEdgeEndpoint(ep) && !ep.UserTrusted {
				continue
			}
			trustedEndpoints = append(trustedEndpoints, filteredEndpoints[i])
		}

		counts = EnvironmentSummaryCountsResponse{
			Total: len(trustedEndpoints),
		}

		groupCounts := make(map[portainer.EndpointGroupID]int)
		platformCounts := platformCounts{}
		healthCounts := healthCounts{}

		for i := range trustedEndpoints {
			endpoint := &trustedEndpoints[i]

			switch endpointutils.EndpointPlatformType(endpoint) {
			case portainer.DockerPlatformType:
				platformCounts.Docker++
			case portainer.KubernetesPlatformType:
				platformCounts.Kubernetes++
			case portainer.AzurePlatformType:
				platformCounts.Azure++
			case portainer.PodmanPlatformType:
				platformCounts.Podman++
			case portainer.UnknownPlatformType:
				log.Error().Int("endpoint_id", int(endpoint.ID)).Msg("Unknown platform type")
			}

			groupCounts[endpoint.GroupID]++

			if endpoint.GroupID == UnassignedGroupID {
				counts.Unassigned++
			}

			// Both counts.* and healthCounts.* are non-exclusive: an outdated env
			// contributes to its connection bucket (Up / Down) and to Outdated.
			outdated := isOutdated(endpoint)
			status := resolveEndpointStatus(endpoint, settings)

			if outdated {
				counts.Outdated++
				healthCounts.Outdated++
			}

			switch status {
			case statusHeartbeat:
				healthCounts.Heartbeat++
				healthCounts.Up++
				counts.Up++
			case statusUp:
				healthCounts.Up++
				counts.Up++
			case statusDown:
				healthCounts.Down++
				counts.Down++
			}
		}

		counts.ByGroup = parseGroupCounts(groupCounts, endpointGroups)
		counts.ByPlatformType = platformCounts
		counts.ByHealth = healthCounts

		return nil
	})

	return response.TxResponse(w, counts, err)
}

// iota order overlaps with portainer.EndpointStatus (Up=1, Down=2) so non-edge
// endpoints can pass their Status straight through. statusHeartbeat (0) is
// edge-only.
const (
	statusHeartbeat = iota
	statusUp
	statusDown
)

func resolveEndpointStatus(endpoint *portainer.Endpoint, settings *portainer.Settings) int {
	if endpointutils.IsEdgeEndpoint(endpoint) {
		if endpointutils.GetHeartbeatStatus(endpoint, settings) {
			return statusHeartbeat
		}
		return statusDown
	}
	return int(endpoint.Status)
}

func parseGroupCounts(counts map[portainer.EndpointGroupID]int, endpointGroups []portainer.EndpointGroup) []groupCount {
	parsedGroupCounts := []groupCount{}

	// Build group name lookup
	groupNameByID := make(map[portainer.EndpointGroupID]string, len(endpointGroups))
	for _, g := range endpointGroups {
		groupNameByID[g.ID] = g.Name
	}

	for groupID, count := range counts {

		parsedGroupCounts = append(parsedGroupCounts,
			groupCount{
				GroupID:   int(groupID),
				GroupName: groupNameByID[groupID],
				Count:     count,
			})
	}

	sort.Slice(parsedGroupCounts, func(i, j int) bool {
		return parsedGroupCounts[i].GroupID < parsedGroupCounts[j].GroupID
	})

	return parsedGroupCounts
}

// canonicalizeSemver ensures v has a "v" prefix as required by golang.org/x/mod/semver.
func canonicalizeSemver(v string) string {
	v = strings.TrimSpace(v)
	if v == "" || strings.HasPrefix(v, "v") {
		return v
	}
	return "v" + v
}

func isOutdated(endpoint *portainer.Endpoint) bool {
	if !endpointutils.IsAgentEndpoint(endpoint) {
		return false
	}

	if endpoint.Agent.Version == "" {
		edgeHasCheckedInWithoutVersion := endpointutils.IsEdgeEndpoint(endpoint) && endpoint.LastCheckInDate > 0
		return edgeHasCheckedInWithoutVersion
	}

	latestVersion := canonicalizeSemver(portainer.APIVersion)
	agentVersion := canonicalizeSemver(endpoint.Agent.Version)

	return semver.Compare(agentVersion, latestVersion) < 0
}
