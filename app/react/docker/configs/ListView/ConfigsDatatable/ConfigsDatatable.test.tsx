import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { Config } from 'docker-types';

import { isoDate } from '@/portainer/filters/filters';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { server } from '@/setup-tests/server';
import { Role, User } from '@/portainer/users/types';
import { createMockUsers } from '@/react-tools/test-mocks';

import { ConfigsDatatable } from './ConfigsDatatable';

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: '1' },
  })),
}));

vi.mock('@@/Link', () => ({
  Link: ({
    children,
    'data-cy': dataCy,
  }: {
    children: React.ReactNode;
    'data-cy'?: string;
  }) => (
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a data-cy={dataCy}>{children}</a>
  ),
}));

beforeEach(() => {
  server.use(
    http.get('/api/endpoints/1', () =>
      HttpResponse.json({
        Id: 1,
        Name: 'test-environment',
        Type: 1,
      })
    )
  );
});

beforeAll(() => {
  // set timezone explicitly to avoid daylight savings drift
  vi.stubEnv('TZ', 'UTC');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

it('should return null when data is loading', () => {
  server.use(
    http.get('/api/endpoints/:environmentId/docker/configs', async () => {
      // Never resolve to simulate loading state
      await new Promise(() => {});
      return HttpResponse.json([]);
    })
  );

  const { container } = renderComponent();

  // Component returns null while loading, so the container's first child is empty
  expect(container.firstChild).toBeEmptyDOMElement();
});

it('should render datatable with configs', async () => {
  const mockConfigs = [
    createMockConfig({ ID: 'config-1', Spec: { Name: 'my-config-1' } }),
    createMockConfig({ ID: 'config-2', Spec: { Name: 'my-config-2' } }),
  ];

  server.use(
    http.get('/api/endpoints/:environmentId/docker/configs', () =>
      HttpResponse.json(mockConfigs)
    )
  );

  renderComponent();

  await waitFor(() => {
    expect(screen.getByRole('region', { name: 'Configs' })).toBeVisible();
  });

  expect(screen.getByText('my-config-1')).toBeVisible();
  expect(screen.getByText('my-config-2')).toBeVisible();
});

it('should display config creation date formatted', async () => {
  const createdAt = '2024-06-15T14:30:00.000000000Z';
  const mockConfigs = [
    createMockConfig({
      ID: 'config-1',
      CreatedAt: createdAt,
    }),
  ];

  server.use(
    http.get('/api/endpoints/:environmentId/docker/configs', () =>
      HttpResponse.json(mockConfigs)
    )
  );

  renderComponent();

  await waitFor(() => {
    expect(screen.getByRole('region', { name: 'Configs' })).toBeVisible();
  });

  const expectedDate = isoDate(mockConfigs[0].CreatedAt);
  expect(screen.getByText(new RegExp(expectedDate))).toBeVisible();
});

it('should show Add config button for admin user', async () => {
  server.use(
    http.get('/api/endpoints/:environmentId/docker/configs', () =>
      HttpResponse.json([createMockConfig()])
    )
  );

  renderComponent(createAdminUser());

  await waitFor(() => {
    expect(screen.getByRole('region', { name: 'Configs' })).toBeVisible();
  });

  expect(screen.getByText(/add config/i)).toBeVisible();
});

it('should show Add config button for standard user', async () => {
  server.use(
    http.get('/api/endpoints/:environmentId/docker/configs', () =>
      HttpResponse.json([createMockConfig()])
    )
  );

  renderComponent(createStandardUser());

  await waitFor(() => {
    expect(screen.getByRole('region', { name: 'Configs' })).toBeVisible();
  });

  expect(screen.getByText(/add config/i)).toBeVisible();
});

it('should render empty datatable when no configs exist', async () => {
  server.use(
    http.get('/api/endpoints/:environmentId/docker/configs', () =>
      HttpResponse.json([])
    )
  );

  renderComponent();

  await waitFor(() => {
    expect(screen.getByRole('region', { name: 'Configs' })).toBeVisible();
  });
});

function createMockConfig(overrides: Partial<Config> = {}): Config {
  return {
    ID: 'config-id-1',
    CreatedAt: '2024-01-15T10:30:00.000000000Z',
    UpdatedAt: '2024-01-15T10:30:00.000000000Z',
    Version: { Index: 1 },
    Spec: {
      Name: 'test-config',
      Labels: {},
      Data: btoa('config data'),
    },
    ...overrides,
  };
}

function createAdminUser(): User {
  return createMockUsers(1, Role.Admin)[0];
}

function createStandardUser(): User {
  return createMockUsers(1, Role.Standard)[0];
}

function renderComponent(user: User = createAdminUser()) {
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(ConfigsDatatable), user)
  );

  return render(<Wrapped />);
}
