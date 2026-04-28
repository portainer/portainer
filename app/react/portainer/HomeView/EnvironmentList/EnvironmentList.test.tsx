import {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
  ReactNode,
} from 'react';
import { http, HttpResponse } from 'msw';
import type { HttpHandler } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Environment,
  EnvironmentStatus,
  EnvironmentType,
  PlatformType,
} from '@/react/portainer/environments/types';
import { UserViewModel } from '@/portainer/models/user';
import { server } from '@/setup-tests/server';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { createMockEnvironment } from '@/react-tools/test-mocks';

import { EnvironmentList } from './EnvironmentList';

// vi.hoisted ensures these are initialised before the vi.mock factory runs.
const { mockUrlParams, mockStateServiceGo } = vi.hoisted(() => ({
  mockUrlParams: {} as { groupBy?: string; filter?: string },
  mockStateServiceGo: vi.fn(),
}));

vi.mock('@uirouter/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uirouter/react')>();
  return {
    ...actual,
    useCurrentStateAndParams: vi.fn(() => ({
      params: mockUrlParams,
      state: {},
    })),
    useRouter: vi.fn(() => ({ stateService: { go: mockStateServiceGo } })),
  };
});

type MenuCtxType = {
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement>;
};

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  // Reset URL params and router spy between tests.
  (Object.keys(mockUrlParams) as Array<keyof typeof mockUrlParams>).forEach(
    (k) => delete mockUrlParams[k]
  );
  mockStateServiceGo.mockClear();
});

vi.mock('@reach/menu-button', () => {
  const MenuCtx = createContext<MenuCtxType | null>(null);

  function Menu({ children }: { children?: ReactNode }) {
    const [isOpen, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      function handleDocDown(e: MouseEvent) {
        const target = e.target as Node | null;
        if (
          isOpen &&
          menuRef.current &&
          target &&
          !menuRef.current.contains(target)
        ) {
          setOpen(false);
        }
      }

      document.addEventListener('mousedown', handleDocDown);
      return () => document.removeEventListener('mousedown', handleDocDown);
    }, [isOpen]);

    return (
      <MenuCtx.Provider value={{ isOpen, setOpen, menuRef }}>
        <div ref={menuRef}>{children}</div>
      </MenuCtx.Provider>
    );
  }

  function MenuButton({
    children,
    onClick: externalOnClick,
    ...props
  }: {
    children?: ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) {
    const ctx = useContext(MenuCtx);

    function handleClick() {
      externalOnClick?.();
      ctx?.setOpen(!ctx.isOpen);
    }

    return (
      <button type="button" onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }

  function MenuList({
    children,
    className,
  }: {
    children?: ReactNode;
    className?: string;
  }) {
    const ctx = useContext(MenuCtx);
    if (!ctx?.isOpen) return null;
    return (
      <div role="menu" className={className}>
        {children}
      </div>
    );
  }

  function MenuItem({
    children,
    onSelect,
    className,
  }: {
    children?: ReactNode;
    onSelect?: () => void;
    className?: string;
  }) {
    const ctx = useContext(MenuCtx);

    function handleClick() {
      onSelect?.();
      ctx?.setOpen(false);
    }

    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
      <div role="menuitem" onClick={handleClick} className={className}>
        {children}
      </div>
    );
  }

  return { Menu, MenuButton, MenuList, MenuItem };
});

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

test('headerFilter "up" applies status filter to the API request', async () => {
  let capturedParams: URLSearchParams | null = null;

  server.use(
    http.get('/api/endpoints', ({ request }) => {
      capturedParams = new URL(request.url).searchParams;
      return HttpResponse.json([], {
        headers: {
          'x-total-available': '0',
          'x-total-count': '0',
        },
      });
    })
  );

  const user = new UserViewModel({ Username: 'test', Role: 2 });
  const Wrapped = withTestQueryProvider(
    withUserProvider(
      withTestRouter(() => (
        <EnvironmentList onClickBrowse={vi.fn()} headerFilter="up" />
      )),
      user
    )
  );

  render(<Wrapped />);

  await screen.findByText('No environments available.');

  expect(capturedParams!.getAll('status[]')).toContain('1');
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
      const platformTypes = new URL(request.url).searchParams
        .getAll('platformTypes[]')
        .map(Number);
      const envTypesByPlatform: Partial<
        Record<PlatformType, EnvironmentType[]>
      > = {
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
      const statuses = new URL(request.url).searchParams
        .getAll('status[]')
        .map(Number);
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
      const types = params.getAll('types[]').map(Number);
      const statuses = params.getAll('status[]').map(Number);

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

  mockUrlParams.groupBy = 'health';

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
    expect(capturedParams?.get('sort')).toBe('Status');
  });
});

test('URL param groupBy=health&filter=up activates Up status filter in API request', async () => {
  let capturedParams: URLSearchParams | null = null;

  mockUrlParams.groupBy = 'health';
  mockUrlParams.filter = 'up';

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
    expect(capturedParams?.getAll('status[]')).toContain('1');
  });
});

test('URL param groupBy=platform&filter=docker activates Docker platform filter in API request', async () => {
  let capturedParams: URLSearchParams | null = null;

  mockUrlParams.groupBy = 'platform';
  mockUrlParams.filter = 'docker';

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
    expect(capturedParams?.getAll('platformTypes[]')).toContain('0');
  });
});

test('URL param filter without groupBy is ignored (default Group sort used)', async () => {
  let capturedParams: URLSearchParams | null = null;

  // filter present but no groupBy — the component should bail out early
  mockUrlParams.filter = 'up';

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

  // status[] should not be sent; sort defaults to Group
  await waitFor(() => {
    expect(capturedParams).not.toBeNull();
  });
  expect(capturedParams!.getAll('status[]')).toHaveLength(0);
  expect(capturedParams!.get('sort')).toBe('Group');
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
      'portainer.home',
      { groupBy: 'health', filter: 'up' },
      { location: 'replace', inherit: true }
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
