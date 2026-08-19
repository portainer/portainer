package libprometheus

import (
	"context"
	"strings"
	"testing"
	"time"

	prometheusreg "github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/prometheus/model/labels"
	"github.com/prometheus/prometheus/storage"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAppendExpositionSamplesSkipsCompositeMetricFamilies(t *testing.T) {
	db, err := OpenTSDB(TSDBConfig{
		DataDir:           t.TempDir(),
		RetentionDuration: time.Hour,
		NoLockfile:        true,
		Registry:          prometheusreg.NewRegistry(),
	})
	require.NoError(t, err)
	defer func() { require.NoError(t, db.Close()) }()

	exposition := strings.NewReader(`# TYPE test_gauge gauge
test_gauge 42
# TYPE test_summary summary
test_summary{quantile="0.5"} 1
test_summary_sum 1
test_summary_count 1
# TYPE test_histogram histogram
test_histogram_bucket{le="1"} 1
test_histogram_bucket{le="+Inf"} 1
test_histogram_sum 1
test_histogram_count 1
`)

	require.NoError(t, AppendExpositionSamples(t.Context(), db, exposition))

	assert.True(t, hasSeries(t, db, "test_gauge"))
	assert.False(t, hasSeries(t, db, "test_summary"))
	assert.False(t, hasSeries(t, db, "test_histogram"))
}

func hasSeries(t *testing.T, db storage.Queryable, metricName string) bool {
	t.Helper()

	now := time.Now().UnixMilli()
	q, err := db.Querier(now-60000, now+60000)
	require.NoError(t, err)
	defer func() { require.NoError(t, q.Close()) }()

	matcher, err := labels.NewMatcher(labels.MatchEqual, "__name__", metricName)
	require.NoError(t, err)

	ss := q.Select(context.Background(), false, nil, matcher)

	for ss.Next() {
		return true
	}

	require.NoError(t, ss.Err())
	return false
}
