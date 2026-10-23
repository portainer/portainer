import { useState, useEffect } from 'react';
import { http, HttpResponse } from 'msw';
import type { HttpHandler } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  EnvironmentStatus,
  EnvironmentType,
  PlatformType,
  Environment,
} from '@/react/portainer/environments/types';
import { UserViewModel } from '@/portainer/models/user';
import { server } from '@/setup-tests/server';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { createMockEnvironment } from '@/react-tools/test-mocks';

import { EnvironmentList } from './EnvironmentList';

function getArrayParam(params: URLSearchParams, key: string): number[] {
  return params.get(key)?.split(',').filter(Boolean).map(Number) ?? [];
}

// vi.hoisted ensures these are initialized before the vi.mock factory runs.
// The store is reactive: stateService.go updates it and notifies React subscribers.
const { mockUrlParamsStore, mockStateServiceGo } = vi.hoisted(() => {
  let snapshot: Record<string, unknown> = {};
  const listeners = new Set<() => void>();

  function notify() {
    listeners.forEach((l) => l());
  }

  return {
    mockUrlParamsStore: {
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      getSnapshot: () => snapshot,
      set: (params: Record<string, unknown>) => {
        snapshot = { ...params };
        notify();
      },
      reset: () => {
        snapshot = {};
        notify();
      },
    },
    mockStateServiceGo: vi.fn(
      (_route: string, params: Record<string, unknown>) => {
        snapshot = { ...snapshot, ...params };
        notify();
      }
    ),
  };
});

vi.mock('@uirouter/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uirouter/react')>();
  return {
    ...actual,
    useCurrentStateAndParams: () => {
      const [params, setParams] = useState(() =>
        mockUrlParamsStore.getSnapshot()
      );
      useEffect(
        () =>
          mockUrlParamsStore.subscribe(() => {
            setParams(mockUrlParamsStore.getSnapshot());
          }),
        []
      );
      return { params, state: {} };
    },
    useRouter: vi.fn(() => ({ stateService: { go: mockStateServiceGo } })),
  };
});

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  mockUrlParamsStore.reset();
  mockStateServiceGo.mockClear();
});

vi.mock('@reach/menu-button');

test('when no environments for query should show empty list message', async () => {
  const { findByText } = await renderComponent(false, []);

  await expect(findByText('No environments available.')).resolves.toBeVisible();
});

test('when user is not admin and no environments at all should show empty list info message', async () => {
  const { findByText } = await renderComponent(false, []);

  await expect(
    findByText(
      'You do not have access to any environment. Please contact your administrator.'
    )
  ).resolves.toBeVisible();
});

test('when user is an admin and no environments at all should show empty list info message', async () => {
  const { findByText } = await renderComponent(true);

  await expect(
    findByText(/No environment available for management. Please head over the/)
  ).resolves.toBeVisible();
});

test('renders environments returned by the API', async () => {
  const environments = [
    createMockEnvironment({ Id: 1, Name: 'prod-cluster', GroupId: 1 }),
    createMockEnvironment({ Id: 2, Name: 'staging-cluster', GroupId: 1 }),
  ];
  const { findByText } = await renderComponent(false, environments);

  await expect(findByText('prod-cluster')).resolves.toBeVisible();
  await expect(findByText('staging-cluster')).resolves.toBeVisible();
});

test('sort buttons are rendered for each sort option', async () => {
  const { findByRole } = await renderComponent(false, []);

  await expect(findByRole('button', { name: /Group/i })).resolves.toBeVisible();
  await expect(
    screen.findByRole('button', { name: /Platform/i })
  ).resolves.toBeVisible();
  await expect(
    screen.findByRole('button', { name: /Health/i })
  ).resolves.toBeVisible();
});

test('clicking inactive sort button switches active sort', async () => {
  const user = userEvent.setup();
  await renderComponent(false, []);

  const platformBtn = await screen.findByRole('button', { name: /Platform/i });
  await user.click(platformBtn);

  expect(screen.getByRole('menu')).toBeVisible();
});

test('Platform filter groups Docker, AgentOnDocker, and EdgeAgentOnDocker together', async () => {
  const user = userEvent.setup();
  const allEnvironments = [
    createMockEnvironment({
      Id: 1,
      Name: 'docker-direct',
      Type: EnvironmentType.Docker,
    }),
    createMockEnvironment({
      Id: 2,
      Name: 'docker-agent',
      Type: EnvironmentType.AgentOnDocker,
    }),
    createMockEnvironment({
      Id: 3,
      Name: 'kube-local',
      Type: EnvironmentType.KubernetesLocal,
    }),
  ];

  await renderComponent(false, allEnvironments, [
    http.get('/api/endpoints/summary', () =>
      HttpResponse.json({
        total: 3,
        up: 3,
        down: 0,
        outdated: 0,
        unassigned: 0,
        byGroup: [],
        byPlatformType: { docker: 2, kubernetes: 1, podman: 0, azure: 0 },
        byHealth: { down: 0, up: 0, outdated: 0, heartbeat: 0 },
      })
    ),
    http.get('/api/endpoints', ({ request }) => {
      const platformTypes = getArrayParam(
        new URL(request.url).searchParams,
        'platformTypes'
      );
      const envTypesByPlatform: Partial<Record<PlatformType, number[]>> = {
        [PlatformType.Docker]: [
          EnvironmentType.Docker,
          EnvironmentType.AgentOnDocker,
          EnvironmentType.EdgeAgentOnDocker,
        ],
        [PlatformType.Kubernetes]: [
          EnvironmentType.KubernetesLocal,
          EnvironmentType.AgentOnKubernetes,
          EnvironmentType.EdgeAgentOnKubernetes,
        ],
        [PlatformType.Podman]: [
          EnvironmentType.Docker,
          EnvironmentType.AgentOnDocker,
          EnvironmentType.EdgeAgentOnDocker,
        ],
        [PlatformType.Azure]: [EnvironmentType.Azure],
      };
      const allowedTypes = platformTypes.flatMap(
        (pt) => envTypesByPlatform[pt as PlatformType] ?? []
      );
      const filtered = allowedTypes.length
        ? allEnvironments.filter((e) => allowedTypes.includes(e.Type))
        : allEnvironments;
      return HttpResponse.json(filtered, {
        headers: {
          'x-total-available': filtered.length.toString(),
          'x-total-count': filtered.length.toString(),
        },
      });
    }),
  ]);

  const platformBtn = await screen.findByRole('button', { name: /Platform/i });
  await user.click(platformBtn);
  await user.click(await screen.findByRole('menuitem', { name: /Docker/ }));

  await waitFor(() => {
    expect(screen.getByText('docker-direct')).toBeVisible();
    expect(screen.getByText('docker-agent')).toBeVisible();
    expect(screen.queryByText('kube-local')).not.toBeInTheDocument();
  });
});

test('Health filter shows only environments matching the selected status', async () => {
  const user = userEvent.setup();
  const allEnvironments = [
    createMockEnvironment({
      Id: 1,
      Name: 'env-up',
      Status: EnvironmentStatus.Up,
    }),
    createMockEnvironment({
      Id: 2,
      Name: 'env-down',
      Status: EnvironmentStatus.Down,
    }),
  ];

  await renderComponent(false, allEnvironments, [
    http.get('/api/endpoints/summary', () =>
      HttpResponse.json({
        total: 2,
        up: 1,
        down: 1,
        outdated: 0,
        unassigned: 0,
        byGroup: [],
        byPlatformType: { docker: 0, kubernetes: 0, podman: 0, azure: 0 },
        byHealth: { down: 1, up: 1, outdated: 0, heartbeat: 0 },
      })
    ),
    http.get('/api/endpoints', ({ request }) => {
      const statuses = getArrayParam(
        new URL(request.url).searchParams,
        'status'
      );
      const filtered = statuses.length
        ? allEnvironments.filter((e) => statuses.includes(e.Status))
        : allEnvironments;
      return HttpResponse.json(filtered, {
        headers: {
          'x-total-available': filtered.length.toString(),
          'x-total-count': filtered.length.toString(),
        },
      });
    }),
  ]);

  const healthBtn = await screen.findByRole('button', { name: /Health/i });
  await user.click(healthBtn);
  await user.click(await screen.findByRole('menuitem', { name: /^Up/ }));

  await waitFor(() => {
    expect(screen.getByText('env-up')).toBeVisible();
    expect(screen.queryByText('env-down')).not.toBeInTheDocument();
  });
});

test('Heartbeat filter shows only edge envs with an active heartbeat', async () => {
  const user = userEvent.setup();
  const allEnvironments = [
    createMockEnvironment({
      Id: 1,
      Name: 'edge-heartbeat',
      Type: EnvironmentType.EdgeAgentOnDocker,
      Status: EnvironmentStatus.Up,
      Heartbeat: true,
    }),
    createMockEnvironment({
      Id: 2,
      Name: 'docker-up',
      Type: EnvironmentType.Docker,
      Status: EnvironmentStatus.Up,
    }),
  ];

  await renderComponent(false, allEnvironments, [
    http.get('/api/endpoints/summary', () =>
      HttpResponse.json({
        total: 2,
        up: 2,
        down: 0,
        outdated: 0,
        unassigned: 0,
        byGroup: [],
        byPlatformType: { docker: 1, kubernetes: 0, podman: 0, azure: 0 },
        byHealth: { down: 0, up: 1, outdated: 0, heartbeat: 1 },
      })
    ),
    http.get('/api/endpoints', ({ request }) => {
      const params = new URL(request.url).searchParams;
      const types = getArrayParam(params, 'types');
      const statuses = getArrayParam(params, 'status');

      let filtered = allEnvironments;
      if (types.length > 0) {
        filtered = filtered.filter((e) => types.includes(e.Type));
      }
      if (statuses.length > 0) {
        filtered = filtered.filter((e) => statuses.includes(e.Status));
      }

      return HttpResponse.json(filtered, {
        headers: {
          'x-total-available': filtered.length.toString(),
          'x-total-count': filtered.length.toString(),
        },
      });
    }),
  ]);

  const healthBtn = await screen.findByRole('button', { name: /Health/i });
  await user.click(healthBtn);
  await user.click(await screen.findByRole('menuitem', { name: /Heartbeat/i }));

  await waitFor(() => {
    expect(screen.getByText('edge-heartbeat')).toBeVisible();
    expect(screen.queryByText('docker-up')).not.toBeInTheDocument();
  });
});

// --- URL parameter tests ---

test('URL param groupBy=health applies Health sort to API request', async () => {
  let capturedParams: URLSearchParams | null = null;

  mockUrlParamsStore.set({ groupBy: 'health' });

  await renderComponent(
    false,
    [],
    [
      http.get('/api/endpoints', ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json([], {
          headers: { 'x-total-available': '0', 'x-total-count': '0' },
        });
      }),
    ]
  );

  await waitFor(() => {
    expect(capturedParams?.get('sort')).toBe('Health');
  });
});

test('URL param groupBy=health&groupFilter=up activates Up status filter in API request', async () => {
  let capturedParams: URLSearchParams | null = null;

  mockUrlParamsStore.set({ groupBy: 'health', groupFilter: 'Up' });

  await renderComponent(
    false,
    [],
    [
      http.get('/api/endpoints', ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json([], {
          headers: { 'x-total-available': '0', 'x-total-count': '0' },
        });
      }),
    ]
  );

  await waitFor(() => {
    // EnvironmentStatus.Up = 1
    expect(capturedParams?.get('status')).toBe('1');
  });
});

test('URL param groupBy=platform&groupFilter=docker activates Docker platform filter in API request', async () => {
  let capturedParams: URLSearchParams | null = null;

  mockUrlParamsStore.set({ groupBy: 'platformtype', groupFilter: 'Docker' });

  await renderComponent(
    false,
    [],
    [
      http.get('/api/endpoints', ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json([], {
          headers: { 'x-total-available': '0', 'x-total-count': '0' },
        });
      }),
    ]
  );

  await waitFor(() => {
    // PlatformType.Docker = 0
    expect(capturedParams?.get('platformTypes')).toBe('0');
  });
});

test('URL param groupFilter without groupBy is ignored (default Id sort used)', async () => {
  let capturedParams: URLSearchParams | null = null;

  // groupFilter present but no groupBy — the component should bail out early
  mockUrlParamsStore.set({ groupFilter: 'up' });

  await renderComponent(
    false,
    [],
    [
      http.get('/api/endpoints', ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json([], {
          headers: { 'x-total-available': '0', 'x-total-count': '0' },
        });
      }),
    ]
  );

  // status[] should not be sent; sort defaults to Id (the Age sort key)
  await waitFor(() => {
    expect(capturedParams).not.toBeNull();
  });
  expect(capturedParams!.get('status')).toBeNull();
  expect(capturedParams!.get('sort')).toBe('Id');
});

test('selecting a sort/filter updates URL via stateService.go', async () => {
  const user = userEvent.setup();

  await renderComponent(
    false,
    [],
    [
      http.get('/api/endpoints/summary', () =>
        HttpResponse.json({
          total: 1,
          up: 1,
          down: 0,
          outdated: 0,
          unassigned: 0,
          byGroup: [],
          byPlatformType: { docker: 1, kubernetes: 0, podman: 0, azure: 0 },
          byHealth: { down: 0, up: 1, outdated: 0, heartbeat: 0 },
        })
      ),
    ]
  );

  const healthBtn = await screen.findByRole('button', { name: /Health/i });
  await user.click(healthBtn);
  await user.click(await screen.findByRole('menuitem', { name: /^Up/ }));

  await waitFor(() => {
    expect(mockStateServiceGo).toHaveBeenCalledWith(
      '.',
      expect.objectContaining({ groupBy: 'Health', groupFilter: 'Up' }),
      { reload: false, location: 'replace' }
    );
  });
});

/**
 * Renders the EnvironmentList component with MSW handler overrides.
 *
 * @param isAdmin - Whether to render as an admin user (Role 1) or non-admin (Role 2).
 * @param environments - Environments returned by the default /api/endpoints handler.
 * @param extraHandlers - Handlers prepended before the default endpoint/summary
 *   handlers, giving them priority for tests that need custom behaviour.
 */
async function renderComponent(
  isAdmin = false,
  environments: Environment[] = [],
  extraHandlers: HttpHandler[] = []
) {
  const user = new UserViewModel({ Username: 'test', Role: isAdmin ? 1 : 2 });

  server.use(
    ...extraHandlers,
    http.get('/api/endpoints', () =>
      HttpResponse.json(environments, {
        headers: {
          'x-total-available': environments.length.toString(),
          'x-total-count': environments.length.toString(),
        },
      })
    ),
    http.get('/api/endpoints/summary', () =>
      HttpResponse.json({
        total: environments.length,
        up: 0,
        down: 0,
        outdated: 0,
        unassigned: 0,
        byGroup: [],
        byPlatformType: { docker: 0, kubernetes: 0, podman: 0, azure: 0 },
        byHealth: { down: 0, up: 0, outdated: 0, heartbeat: 0 },
      })
    )
  );

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(EnvironmentList), user)
  );

  const queries = render(<Wrapped onClickBrowse={vi.fn()} />);

  await queries.findByText('SORT BY:');

  return queries;
}
