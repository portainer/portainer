import { QueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Fragment } from 'react';

import { server } from '@/setup-tests/server';
import { withReactQuery } from '@/react-tools/withReactQuery';

import { useAggregatedStats } from './useAggregatedStats';

describe('useAggregatedStats', () => {
  it('does not latch network/IO unavailable from data cached before this mount fetched', async () => {
    const queryClient = newQueryClient();

    mockResponse(statsFixture({ networks: {}, blkio_stats: undefined }));

    // Seed the cache with a "network/IO unavailable" sample from a first mount.
    const first = renderStats(queryClient);
    await waitFor(() =>
      expect(first.result.current.networkUnavailable).toBe(true)
    );
    first.unmount();

    // A fresh sample is available for this mount's own fetch, but react-query
    // synchronously serves the stale cached sample on first render, before
    // that fetch resolves. That stale sample must not re-latch as unavailable.
    mockResponse(statsFixture());
    const second = renderStats(queryClient);

    expect(second.result.current.networkUnavailable).toBe(false);
    expect(second.result.current.ioUnavailable).toBe(false);

    await waitFor(() =>
      expect(second.result.current.chartData.length).toBeGreaterThan(0)
    );

    expect(second.result.current.networkUnavailable).toBe(false);
    expect(second.result.current.ioUnavailable).toBe(false);
  });

  it('latches network/IO unavailable once this mount fetches a sample missing them', async () => {
    mockResponse(statsFixture({ networks: {}, blkio_stats: undefined }));

    const { result } = renderStats();

    await waitFor(() => expect(result.current.networkUnavailable).toBe(true));
    expect(result.current.ioUnavailable).toBe(true);
  });

  it('accumulates chart data as soon as a sample arrives', async () => {
    mockResponse(statsFixture());

    const { result } = renderStats();

    await waitFor(() => expect(result.current.chartData).toHaveLength(1));
  });
});

function mockResponse(data: Record<string, unknown>) {
  server.use(
    http.get('/api/endpoints/1/docker/containers/container-id/stats', () =>
      HttpResponse.json(data)
    )
  );
}

function statsFixture(overrides: Record<string, unknown> = {}) {
  return {
    read: '2024-01-01T00:00:01Z',
    preread: '2024-01-01T00:00:00Z',
    memory_stats: { usage: 100 },
    cpu_stats: {
      cpu_usage: { total_usage: 200 },
      system_cpu_usage: 1000,
      online_cpus: 2,
    },
    precpu_stats: { cpu_usage: { total_usage: 100 }, system_cpu_usage: 500 },
    networks: { eth0: { rx_bytes: 10, tx_bytes: 20 } },
    blkio_stats: {
      io_service_bytes_recursive: [
        { major: 0, minor: 0, op: 'Read', value: 1 },
      ],
    },
    ...overrides,
  };
}

function renderStats(queryClient: QueryClient = newQueryClient()) {
  return renderHook(
    () => useAggregatedStats(1, 'container-id', undefined, 30),
    { wrapper: withReactQuery(Fragment, queryClient) }
  );
}

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
