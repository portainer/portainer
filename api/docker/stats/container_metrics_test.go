package stats

import (
	"context"
	"fmt"
	"io"
	"strings"
	"testing"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockStatsClient implements DockerStatsClient for unit testing.
type mockStatsClient struct {
	responses map[string]string // containerID -> JSON payload
	err       map[string]error  // containerID -> error to return
	osType    string            // reported OS type (defaults to "linux")
}

func (m *mockStatsClient) ContainerStats(_ context.Context, containerID string, _ bool) (container.StatsResponseReader, error) {
	if err, ok := m.err[containerID]; ok {
		return container.StatsResponseReader{}, err
	}
	payload, ok := m.responses[containerID]
	if !ok {
		return container.StatsResponseReader{}, fmt.Errorf("no mock response for container %s", containerID)
	}
	osType := m.osType
	if osType == "" {
		osType = "linux"
	}
	return container.StatsResponseReader{
		Body:   io.NopCloser(strings.NewReader(payload)),
		OSType: osType,
	}, nil
}

// buildStatsJSON constructs a minimal Docker stats JSON payload.
func buildStatsJSON(cpuTotal, preCPUTotal, systemCPU, preSystemCPU uint64, onlineCPUs int, memUsage, memLimit uint64, blkio []blkioEntry) string {
	blkioJSON := "null"
	if blkio != nil {
		parts := make([]string, len(blkio))
		for i, e := range blkio {
			parts[i] = fmt.Sprintf(`{"op":%q,"value":%d,"major":0,"minor":0}`, e.Op, e.Value)
		}
		blkioJSON = "[" + strings.Join(parts, ",") + "]"
	}
	return fmt.Sprintf(`{
		"cpu_stats":    {"cpu_usage":{"total_usage":%d},"system_cpu_usage":%d,"online_cpus":%d},
		"precpu_stats": {"cpu_usage":{"total_usage":%d},"system_cpu_usage":%d},
		"memory_stats": {"usage":%d,"limit":%d},
		"blkio_stats":  {"io_service_bytes_recursive":%s}
	}`, cpuTotal, systemCPU, onlineCPUs, preCPUTotal, preSystemCPU, memUsage, memLimit, blkioJSON)
}

func TestFetchContainerMetrics_CPUPercent(t *testing.T) {
	// cpuDelta=200, systemDelta=1000, onlineCPUs=2 → 200/1000*2*100 = 40%
	payload := buildStatsJSON(1200, 1000, 5000, 4000, 2, 0, 0, nil)
	cli := &mockStatsClient{responses: map[string]string{"c1": payload}}
	cache := NewMetricsCache()
	containers := []container.Summary{{ID: "c1", Names: []string{"/myapp"}}}

	metrics, err := FetchContainerMetrics(context.Background(), cli, 1, containers, cache)
	require.NoError(t, err)
	require.Len(t, metrics, 1)
	assert.InDelta(t, 40.0, metrics[0].CPUPercent, 0.001)
	assert.Equal(t, "c1", metrics[0].ContainerID)
	assert.Equal(t, "myapp", metrics[0].ContainerName)
}

func TestFetchContainerMetrics_CPUPercentZeroSystemDelta(t *testing.T) {
	// systemDelta=0 (first ever reading) → CPU% must be 0, not NaN/Inf
	payload := buildStatsJSON(1000, 1000, 0, 0, 2, 0, 0, nil)
	cli := &mockStatsClient{responses: map[string]string{"c1": payload}}
	cache := NewMetricsCache()
	containers := []container.Summary{{ID: "c1", Names: []string{"/app"}}}

	metrics, err := FetchContainerMetrics(context.Background(), cli, 1, containers, cache)
	require.NoError(t, err)
	require.Len(t, metrics, 1)
	assert.Equal(t, 0.0, metrics[0].CPUPercent)
}

func TestFetchContainerMetrics_Memory(t *testing.T) {
	payload := buildStatsJSON(0, 0, 0, 0, 1, 256*1024*1024, 1024*1024*1024, nil)
	cli := &mockStatsClient{responses: map[string]string{"c1": payload}}
	cache := NewMetricsCache()
	containers := []container.Summary{{ID: "c1", Names: []string{"/app"}}}

	metrics, err := FetchContainerMetrics(context.Background(), cli, 1, containers, cache)
	require.NoError(t, err)
	require.Len(t, metrics, 1)
	assert.Equal(t, uint64(256*1024*1024), metrics[0].MemoryUsage)
	assert.Equal(t, uint64(1024*1024*1024), metrics[0].MemoryLimit)
	assert.InDelta(t, 25.0, metrics[0].MemoryPercent, 0.001)
}

func TestFetchContainerMetrics_BlkioNilSlice(t *testing.T) {
	payload := buildStatsJSON(0, 0, 0, 0, 1, 0, 0, nil)
	cli := &mockStatsClient{responses: map[string]string{"c1": payload}}
	cache := NewMetricsCache()
	containers := []container.Summary{{ID: "c1", Names: []string{"/app"}}}

	metrics, err := FetchContainerMetrics(context.Background(), cli, 1, containers, cache)
	require.NoError(t, err)
	require.Len(t, metrics, 1)
	assert.False(t, metrics[0].BlkioAvailable, "nil io_service_bytes_recursive should be unavailable")
}

func TestFetchContainerMetrics_BlkioBothZero(t *testing.T) {
	// Slice present but all-zero — kernel without cgroup blkio controller.
	blkio := []blkioEntry{{Op: "read", Value: 0}, {Op: "write", Value: 0}}
	payload := buildStatsJSON(0, 0, 0, 0, 1, 0, 0, blkio)
	cli := &mockStatsClient{responses: map[string]string{"c1": payload}}
	cache := NewMetricsCache()
	containers := []container.Summary{{ID: "c1", Names: []string{"/app"}}}

	metrics, err := FetchContainerMetrics(context.Background(), cli, 1, containers, cache)
	require.NoError(t, err)
	require.Len(t, metrics, 1)
	assert.False(t, metrics[0].BlkioAvailable, "all-zero blkio should be unavailable")
}

func TestFetchContainerMetrics_BlkioRateOnSecondPoll(t *testing.T) {
	blkio := []blkioEntry{{Op: "read", Value: 2048}, {Op: "write", Value: 1024}}
	payload := buildStatsJSON(0, 0, 0, 0, 1, 0, 0, blkio)
	cli := &mockStatsClient{responses: map[string]string{"c1": payload}}
	cache := NewMetricsCache()
	containers := []container.Summary{{ID: "c1", Names: []string{"/app"}}}

	// First poll — no previous entry, rate should be 0 even though data is
	// available.
	metrics, err := FetchContainerMetrics(context.Background(), cli, 1, containers, cache)
	require.NoError(t, err)
	require.Len(t, metrics, 1)
	assert.True(t, metrics[0].BlkioAvailable)
	assert.Equal(t, 0.0, metrics[0].BlockReadRate, "first poll should have no rate")
	assert.Equal(t, 0.0, metrics[0].BlockWriteRate, "first poll should have no rate")

	// Manually advance the cache timestamp by 2 seconds and bump the counters
	// to simulate a second poll where 4096 read bytes and 2048 write bytes
	// accumulated over 2 seconds → 2048 read/s, 1024 write/s.
	blkio2 := []blkioEntry{{Op: "read", Value: 6144}, {Op: "write", Value: 3072}}
	payload2 := buildStatsJSON(0, 0, 0, 0, 1, 0, 0, blkio2)
	cli.responses["c1"] = payload2

	// Backdate the cache entry by 2 seconds to simulate elapsed time.
	key := cacheKey(1, "c1")
	cache.mu.Lock()
	entry := cache.store[key]
	entry.sampledAt = entry.sampledAt.Add(-2 * time.Second)
	cache.store[key] = entry
	cache.mu.Unlock()

	metrics2, err := FetchContainerMetrics(context.Background(), cli, 1, containers, cache)
	require.NoError(t, err)
	require.Len(t, metrics2, 1)
	assert.True(t, metrics2[0].BlkioAvailable)
	assert.InDelta(t, 2048.0, metrics2[0].BlockReadRate, 1.0, "read rate should be ~2048 B/s")
	assert.InDelta(t, 1024.0, metrics2[0].BlockWriteRate, 1.0, "write rate should be ~1024 B/s")
}

func TestFetchContainerMetrics_BlkioNegativeDeltaClamped(t *testing.T) {
	// Simulate a counter reset after container restart: current values are
	// lower than the cached baseline.
	cache := NewMetricsCache()
	key := cacheKey(1, "c1")
	cache.mu.Lock()
	cache.store[key] = deltaEntry{
		blkRead:   10000,
		blkWrite:  5000,
		sampledAt: time.Now().Add(-5 * time.Second),
	}
	cache.mu.Unlock()

	// Current counters are lower than the cached ones → reset.
	blkio := []blkioEntry{{Op: "read", Value: 100}, {Op: "write", Value: 50}}
	payload := buildStatsJSON(0, 0, 0, 0, 1, 0, 0, blkio)
	cli := &mockStatsClient{responses: map[string]string{"c1": payload}}
	containers := []container.Summary{{ID: "c1", Names: []string{"/app"}}}

	metrics, err := FetchContainerMetrics(context.Background(), cli, 1, containers, cache)
	require.NoError(t, err)
	require.Len(t, metrics, 1)
	assert.Equal(t, 0.0, metrics[0].BlockReadRate, "negative delta should be clamped to 0")
	assert.Equal(t, 0.0, metrics[0].BlockWriteRate, "negative delta should be clamped to 0")
}

func TestFetchContainerMetrics_ContainerErrorSkipped(t *testing.T) {
	cli := &mockStatsClient{
		responses: map[string]string{"c2": buildStatsJSON(200, 100, 1000, 500, 1, 0, 0, nil)},
		err:       map[string]error{"c1": fmt.Errorf("connection refused")},
	}
	cache := NewMetricsCache()
	containers := []container.Summary{
		{ID: "c1", Names: []string{"/app1"}},
		{ID: "c2", Names: []string{"/app2"}},
	}

	metrics, err := FetchContainerMetrics(context.Background(), cli, 1, containers, cache)
	require.NoError(t, err, "individual container errors should not fail the request")
	require.Len(t, metrics, 1, "failed container should be skipped")
	assert.Equal(t, "c2", metrics[0].ContainerID)
}

func TestFetchContainerMetrics_WindowsCPUNotAvailable(t *testing.T) {
	payload := buildStatsJSON(1200, 1000, 0, 0, 2, 0, 0, nil)
	cli := &mockStatsClient{
		responses: map[string]string{"c1": payload},
		osType:    "windows",
	}
	cache := NewMetricsCache()
	containers := []container.Summary{{ID: "c1", Names: []string{"/app"}}}

	metrics, err := FetchContainerMetrics(context.Background(), cli, 1, containers, cache)
	require.NoError(t, err)
	require.Len(t, metrics, 1)
	assert.False(t, metrics[0].CPUAvailable, "Windows containers should report CPU as unavailable")
	assert.Equal(t, 0.0, metrics[0].CPUPercent)
}

func TestFetchContainerMetrics_LinuxCPUAvailable(t *testing.T) {
	payload := buildStatsJSON(1200, 1000, 5000, 4000, 2, 0, 0, nil)
	cli := &mockStatsClient{responses: map[string]string{"c1": payload}}
	cache := NewMetricsCache()
	containers := []container.Summary{{ID: "c1", Names: []string{"/app"}}}

	metrics, err := FetchContainerMetrics(context.Background(), cli, 1, containers, cache)
	require.NoError(t, err)
	require.Len(t, metrics, 1)
	assert.True(t, metrics[0].CPUAvailable)
}

func TestFetchContainerMetrics_CachePrunesStoppedContainers(t *testing.T) {
	payload := buildStatsJSON(0, 0, 0, 0, 1, 0, 0, []blkioEntry{{Op: "read", Value: 1024}, {Op: "write", Value: 512}})
	cli := &mockStatsClient{responses: map[string]string{
		"c1": payload,
		"c2": payload,
	}}
	cache := NewMetricsCache()
	both := []container.Summary{
		{ID: "c1", Names: []string{"/app1"}},
		{ID: "c2", Names: []string{"/app2"}},
	}

	// First poll: both containers running — both added to cache.
	_, err := FetchContainerMetrics(context.Background(), cli, 1, both, cache)
	require.NoError(t, err)
	cache.mu.Lock()
	assert.Len(t, cache.store, 2, "both containers should be in cache after first poll")
	cache.mu.Unlock()

	// Second poll: only c1 is running — c2's cache entry should be deleted.
	onlyC1 := []container.Summary{{ID: "c1", Names: []string{"/app1"}}}
	_, err = FetchContainerMetrics(context.Background(), cli, 1, onlyC1, cache)
	require.NoError(t, err)
	cache.mu.Lock()
	assert.Len(t, cache.store, 1, "stopped container entry should be pruned")
	_, c2Present := cache.store[cacheKey(1, "c2")]
	cache.mu.Unlock()
	assert.False(t, c2Present, "c2 entry should have been deleted")
}

func TestFetchContainerMetrics_MemoryPageCacheSubtracted(t *testing.T) {
	// Build a payload where usage=300MB but cache=100MB → reported usage should be 200MB.
	const usage = 300 * 1024 * 1024
	const pageCache = 100 * 1024 * 1024
	const limit = 1024 * 1024 * 1024

	// Inline custom JSON to include memory_stats.stats.cache.
	payloadWithCache := fmt.Sprintf(`{
		"cpu_stats":    {"cpu_usage":{"total_usage":0},"system_cpu_usage":0,"online_cpus":1},
		"precpu_stats": {"cpu_usage":{"total_usage":0},"system_cpu_usage":0},
		"memory_stats": {"usage":%d,"limit":%d,"stats":{"cache":%d}},
		"blkio_stats":  {"io_service_bytes_recursive":null}
	}`, usage, limit, pageCache)

	cli := &mockStatsClient{responses: map[string]string{"c1": payloadWithCache}}
	cache := NewMetricsCache()
	containers := []container.Summary{{ID: "c1", Names: []string{"/app"}}}

	metrics, err := FetchContainerMetrics(context.Background(), cli, 1, containers, cache)
	require.NoError(t, err)
	require.Len(t, metrics, 1)
	assert.Equal(t, uint64(usage-pageCache), metrics[0].MemoryUsage, "page cache should be subtracted from memory usage")
}
