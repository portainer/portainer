package libpolicy

import (
	"hash/fnv"
	"sort"
	"strconv"

	"github.com/segmentio/encoding/json"

	portainer "github.com/portainer/portainer/api"
)

// ConfigFingerprint is the generic primitive: FNV-1a over serialized policy
// config bytes. It is a change detector, not a security boundary; collisions
// are acceptable because a later poll or policy edit will retry reconciliation.
// Callers must ensure the bytes are deterministic (e.g. collections sorted
// before marshaling).
//
// New policy types should call this after marshaling their own config struct.
func ConfigFingerprint(config []byte) string {
	h := fnv.New32a()
	h.Write(config)
	return strconv.FormatUint(uint64(h.Sum32()), 16)
}

// HelmPolicyFingerprint computes a fingerprint for a Helm policy from its chart
// summaries. Charts are sorted by name before hashing so the result is
// order-independent. The restore manifest is excluded because it does not
// affect what gets installed.
//
// Both server-ee and the agent import this function to guarantee they compute
// identical fingerprints for the same chart summaries.
func HelmPolicyFingerprint(chartSummaries []portainer.PolicyChartSummary) string {
	sorted := make([]portainer.PolicyChartSummary, len(chartSummaries))
	copy(sorted, chartSummaries)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].ChartName < sorted[j].ChartName })
	b, err := json.Marshal(portainer.HelmPolicyConfig{Charts: sorted})
	if err != nil {
		// json.Marshal of a known struct with no custom marshalers cannot error.
		return ""
	}
	return ConfigFingerprint(b)
}
