import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { StackType } from '@/react/common/stacks/types';
import { useInfo } from '@/react/docker/proxy/queries/useInfo';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { server } from '@/setup-tests/server';

import { useIsDeployable } from './useIsDeployable';

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

function mockInfo(swarm: { NodeID: string; ControlAvailable: boolean } | null) {
  server.use(
    http.get('/api/endpoints/1/docker/info', () =>
      HttpResponse.json(swarm ? { Swarm: swarm } : {})
    )
  );
}

// The `info` probe shares the same query key as the info query inside
// useIsSwarmManager, so waiting for it guarantees the deployability booleans
// have settled to their post-fetch values before we assert.
function renderDeployability() {
  return renderHook(
    () => ({
      info: useInfo(1),
      compose: useIsDeployable(StackType.DockerCompose),
      swarm: useIsDeployable(StackType.DockerSwarm),
    }),
    { wrapper: withTestQueryProvider(({ children }) => <>{children}</>) }
  );
}

describe('useIsDeployable', () => {
  it('deploys compose (not swarm) on a standalone node', async () => {
    mockInfo(null);

    const { result } = renderDeployability();
    await waitFor(() => expect(result.current.info.isSuccess).toBe(true));

    expect(result.current.compose).toBe(true);
    expect(result.current.swarm).toBe(false);
  });

  it('deploys swarm (not compose) on a swarm manager node', async () => {
    mockInfo({ NodeID: 'node-1', ControlAvailable: true });

    const { result } = renderDeployability();
    await waitFor(() => expect(result.current.info.isSuccess).toBe(true));

    expect(result.current.compose).toBe(false);
    expect(result.current.swarm).toBe(true);
  });

  // Regression for BE-12824: a worker joined to a swarm must still deploy
  // compose stacks, not swarm stacks (it cannot query swarm management).
  it('deploys compose (not swarm) on a swarm worker node', async () => {
    mockInfo({ NodeID: 'node-2', ControlAvailable: false });

    const { result } = renderDeployability();
    await waitFor(() => expect(result.current.info.isSuccess).toBe(true));

    expect(result.current.compose).toBe(true);
    expect(result.current.swarm).toBe(false);
  });
});
