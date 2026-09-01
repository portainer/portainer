package stats

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/logs"

	"github.com/docker/docker/api/types/container"
	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
)

// DockerStatsClient is the subset of the Docker client API used for fetching
// per-container resource usage stats.
type DockerStatsClient interface {
	ContainerStats(ctx context.Context, containerID string, stream bool) (container.StatsResponseReader, error)
}

// deltaEntry stores blkio cumulative counters so a bytes/second rate can be
// derived on the next poll. Entries are lost on Portainer restart; the first
// reading after restart shows 0 rate until the second poll.
type deltaEntry struct {
	blkRead   uint64
	blkWrite  uint64
	sampledAt time.Time
}

// MetricsCache is a process-scoped, in-memory store of previous blkio
// readings keyed by "endpointID/containerID". It is pruned on every poll to
// contain only currently-running containers.
type MetricsCache struct {
	mu    sync.Mutex
	store map[string]deltaEntry
}

// NewMetricsCache allocates a ready-to-use MetricsCache.
func NewMetricsCache() *MetricsCache {
	return &MetricsCache{
		store: make(map[string]deltaEntry),
	}
}

// ContainerMetric is the per-container resource-usage payload returned by the
// metrics endpoint.
type ContainerMetric struct {
	ContainerID    string  `json:"containerId"`
	ContainerName  string  `json:"containerName"`
	CPUPercent     float64 `json:"cpuPercent"`
	CPUAvailable   bool    `json:"cpuAvailable"`
	MemoryUsage    uint64  `json:"memoryUsage"`
	MemoryLimit    uint64  `json:"memoryLimit"`
	MemoryPercent  float64 `json:"memoryPercent"`
	BlockReadRate  float64 `json:"blockReadRate"`
	BlockWriteRate float64 `json:"blockWriteRate"`
	BlkioAvailable bool    `json:"blkioAvailable"`
}

// dockerRawStats is the decode target for the Docker /containers/{id}/stats
// stream=false JSON response. Only the fields we use are mapped.
type dockerRawStats struct {
	CPUStats    cpuStats    `json:"cpu_stats"`
	PreCPUStats cpuStats    `json:"precpu_stats"`
	MemoryStats memoryStats `json:"memory_stats"`
	BlkioStats  blkioStats  `json:"blkio_stats"`
}

type cpuStats struct {
	CPUUsage       cpuUsage `json:"cpu_usage"`
	SystemCPUUsage uint64   `json:"system_cpu_usage"`
	OnlineCPUs     int      `json:"online_cpus"`
}

type cpuUsage struct {
	TotalUsage uint64 `json:"total_usage"`
}

type memoryStats struct {
	Usage uint64            `json:"usage"`
	Limit uint64            `json:"limit"`
	Stats map[string]uint64 `json:"stats"`
}

type blkioStats struct {
	IOServiceBytesRecursive []blkioEntry `json:"io_service_bytes_recursive"`
}

type blkioEntry struct {
	Op    string `json:"op"`
	Value uint64 `json:"value"`
}

// containerMetricResult carries both the public metric and the raw blkio
// counters needed to update the delta cache.
type containerMetricResult struct {
	metric   ContainerMetric
	rawRead  uint64
	rawWrite uint64
}

// FetchContainerMetrics calls /containers/{id}/stats?stream=false for each
// container concurrently (semaphore of 5, matching CalculateContainerStats).
// Individual container failures are logged and skipped. The cache is pruned
// after each poll so entries for stopped containers are removed.
func FetchContainerMetrics(
	ctx context.Context,
	cli DockerStatsClient,
	endpointID portainer.EndpointID,
	containers []container.Summary,
	cache *MetricsCache,
) ([]ContainerMetric, error) {
	var (
		mu      sync.Mutex
		wg      sync.WaitGroup
		results = make([]containerMetricResult, 0, len(containers))
	)

	semaphore := make(chan struct{}, 5)

	// Snapshot existing cache entries before the parallel fetch so every
	// goroutine sees a consistent baseline from the previous poll.
	cache.mu.Lock()
	prevEntries := make(map[string]deltaEntry, len(cache.store))
	for k, v := range cache.store {
		prevEntries[k] = v
	}
	cache.mu.Unlock()

	now := time.Now()

	for i := range containers {
		c := containers[i]
		id := c.ID

		// Derive a display name; Docker prepends "/" to container names.
		nameLen := min(12, len(id))
		name := id[:nameLen]
		if len(c.Names) > 0 {
			name = strings.TrimPrefix(c.Names[0], "/")
		}

		semaphore <- struct{}{}
		wg.Go(func() {
			defer func() { <-semaphore }()

			key := cacheKey(endpointID, id)
			result, err := fetchOneContainerMetric(ctx, cli, id, name, prevEntries[key], now)
			if err != nil {
				log.Warn().Err(err).Str("container", id).Msg("Unable to retrieve container metrics")
				return
			}

			mu.Lock()
			results = append(results, result)
			mu.Unlock()
		})
	}

	wg.Wait()

	// Build the set of keys returned this poll so we can prune stale entries.
	activeKeys := make(map[string]struct{}, len(results))
	for _, r := range results {
		activeKeys[cacheKey(endpointID, r.metric.ContainerID)] = struct{}{}
	}

	// Bulk-update cache: write new readings, delete entries for containers
	// that are no longer running (stopped, removed, or failed to respond).
	endpointPrefix := fmt.Sprintf("%d/", endpointID)
	cache.mu.Lock()
	for _, r := range results {
		if r.metric.BlkioAvailable {
			cache.store[cacheKey(endpointID, r.metric.ContainerID)] = deltaEntry{
				blkRead:   r.rawRead,
				blkWrite:  r.rawWrite,
				sampledAt: now,
			}
		}
	}
	for k := range cache.store {
		if strings.HasPrefix(k, endpointPrefix) {
			if _, active := activeKeys[k]; !active {
				delete(cache.store, k)
			}
		}
	}
	cache.mu.Unlock()

	// Convert results to the public slice.
	metrics := make([]ContainerMetric, len(results))
	for i, r := range results {
		metrics[i] = r.metric
	}

	return metrics, nil
}

func fetchOneContainerMetric(
	ctx context.Context,
	cli DockerStatsClient,
	containerID, containerName string,
	prev deltaEntry,
	now time.Time,
) (containerMetricResult, error) {
	statsResp, err := cli.ContainerStats(ctx, containerID, false)
	if err != nil {
		return containerMetricResult{}, err
	}
	defer logs.CloseAndLogErr(statsResp.Body)

	var raw dockerRawStats
	if err := json.NewDecoder(statsResp.Body).Decode(&raw); err != nil {
		return containerMetricResult{}, fmt.Errorf("decode stats for %s: %w", containerID, err)
	}

	metric := ContainerMetric{
		ContainerID:   containerID,
		ContainerName: containerName,
	}

	// --- CPU % ---
	// precpu_stats is included by Docker in stream=false responses and
	// represents the previous sample. When it is the first ever reading for
	// this container, systemDelta will be 0 and we return 0% (same as
	// `docker stats`).
	// On Windows, system_cpu_usage is always 0 so CPU% cannot be calculated.
	isWindows := statsResp.OSType == "windows"
	metric.CPUAvailable = !isWindows
	if !isWindows {
		cpuDelta := float64(raw.CPUStats.CPUUsage.TotalUsage) - float64(raw.PreCPUStats.CPUUsage.TotalUsage)
		systemDelta := float64(raw.CPUStats.SystemCPUUsage) - float64(raw.PreCPUStats.SystemCPUUsage)
		if systemDelta > 0 && cpuDelta >= 0 {
			onlineCPUs := raw.CPUStats.OnlineCPUs
			if onlineCPUs == 0 {
				onlineCPUs = 1
			}
			metric.CPUPercent = (cpuDelta / systemDelta) * float64(onlineCPUs) * 100.0
		}
	}

	// --- Memory ---
	// Subtract the page cache from usage to match `docker stats` output.
	// On cgroup v1 the cache is in stats["cache"]; on cgroup v2 it is in
	// stats["inactive_file"]. On Windows neither key is present.
	memUsage := raw.MemoryStats.Usage
	if v, ok := raw.MemoryStats.Stats["cache"]; ok && memUsage > v {
		memUsage -= v
	} else if v, ok := raw.MemoryStats.Stats["inactive_file"]; ok && memUsage > v {
		memUsage -= v
	}
	metric.MemoryUsage = memUsage
	metric.MemoryLimit = raw.MemoryStats.Limit
	if raw.MemoryStats.Limit > 0 {
		metric.MemoryPercent = float64(memUsage) / float64(raw.MemoryStats.Limit) * 100.0
	}

	// --- Block I/O ---
	var blkRead, blkWrite uint64
	for _, entry := range raw.BlkioStats.IOServiceBytesRecursive {
		switch strings.ToLower(entry.Op) {
		case "read":
			blkRead += entry.Value
		case "write":
			blkWrite += entry.Value
		}
	}

	// Mark as unavailable when the kernel / storage driver returns no data at
	// all, or returns all-zeros (cgroupv1 hosts without blkio controller).
	blkioAvailable := len(raw.BlkioStats.IOServiceBytesRecursive) > 0 && !(blkRead == 0 && blkWrite == 0)
	metric.BlkioAvailable = blkioAvailable

	if blkioAvailable && !prev.sampledAt.IsZero() {
		elapsed := now.Sub(prev.sampledAt).Seconds()
		if elapsed > 0 {
			metric.BlockReadRate = float64(safeDelta(blkRead, prev.blkRead)) / elapsed
			metric.BlockWriteRate = float64(safeDelta(blkWrite, prev.blkWrite)) / elapsed
		}
	}

	return containerMetricResult{
		metric:   metric,
		rawRead:  blkRead,
		rawWrite: blkWrite,
	}, nil
}

// safeDelta returns curr - prev clamped to 0 to handle counter resets
// (e.g. after a container restart).
func safeDelta(curr, prev uint64) uint64 {
	if curr < prev {
		return 0
	}
	return curr - prev
}

func cacheKey(endpointID portainer.EndpointID, containerID string) string {
	return fmt.Sprintf("%d/%s", endpointID, containerID)
}
