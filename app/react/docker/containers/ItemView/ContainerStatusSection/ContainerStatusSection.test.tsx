import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { ContainerDetailsViewModel } from '@/docker/models/containerDetails';
import { ContainerEngine } from '@/react/portainer/environments/types';
import { server } from '@/setup-tests/server';
import {
  createMockEnvironment,
  createMockUser,
} from '@/react-tools/test-mocks';

import { ContainerStatusSection } from './ContainerStatusSection';

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 1 },
  })),
}));

describe('ContainerStatusSection', () => {
  beforeEach(() => {
    // Mock environment endpoint
    server.use(
      http.get('/api/endpoints/:id', () =>
        HttpResponse.json(
          createMockEnvironment({
            Id: 1,
            ContainerEngine: ContainerEngine.Docker,
            SecuritySettings: {
              allowContainerCapabilitiesForRegularUsers: true,
              allowHostNamespaceForRegularUsers: true,
              allowDeviceMappingForRegularUsers: true,
              allowSysctlSettingForRegularUsers: true,
              allowBindMountsForRegularUsers: true,
              allowPrivilegedModeForRegularUsers: true,
              allowStackManagementForRegularUsers: true,
              allowVolumeBrowserForRegularUsers: true,
              allowSecurityOptForRegularUsers: true,
              enableHostManagementFeatures: true,
            },
          })
        )
      )
    );
  });

  test('renders container status information for running container', async () => {
    const container = createMockContainer({
      Id: 'abc123',
      Name: '/my-nginx-container',
      State: {
        Running: true,
        Paused: false,
        Restarting: false,
        Status: 'running',
        StartedAt: '2024-01-01T10:00:00Z',
        FinishedAt: '',
        ExitCode: 0,
      },
      NetworkSettings: {
        IPAddress: '172.17.0.5',
      },
    });

    renderComponent(container);

    // Verify widget title
    expect(await screen.findByText('Container status')).toBeVisible();

    // Verify table is rendered
    const table = screen.getByTestId('container-status-table');
    expect(table).toBeVisible();

    // Verify container ID
    expect(screen.getByText('abc123')).toBeVisible();

    // Verify container name (without leading slash)
    expect(screen.getByText('my-nginx-container')).toBeVisible();

    // Verify IP address
    expect(screen.getByText('172.17.0.5')).toBeVisible();

    // Verify status shows running
    expect(screen.getByText(/running/i)).toBeVisible();

    // Verify Start time row is present (only for running containers)
    expect(screen.getByText('Start time')).toBeVisible();

    // Verify Finished row is NOT present for running containers
    expect(screen.queryByText('Finished')).not.toBeInTheDocument();
  });

  test('renders container status information for stopped container', async () => {
    const container = createMockContainer({
      State: {
        Running: false,
        Paused: false,
        Restarting: false,
        Status: 'exited',
        StartedAt: '2024-01-01T10:00:00Z',
        FinishedAt: '2024-01-01T11:00:00Z',
        ExitCode: 137,
      },
    });

    renderComponent(container);

    expect(await screen.findByText('Container status')).toBeVisible();

    // Verify status shows stopped
    expect(screen.getByText(/stopped/i)).toBeVisible();

    // Verify exit code is shown
    expect(screen.getByText(/with exit code 137/i)).toBeVisible();

    // Verify Finished row is present for stopped containers
    expect(screen.getByText('Finished')).toBeVisible();

    // Verify Start time row is NOT present for stopped containers
    expect(screen.queryByText('Start time')).not.toBeInTheDocument();
  });

  test('renders NameRow component with correct props', async () => {
    const container = createMockContainer({
      Id: 'test-123',
      Name: '/my-container',
    });

    renderComponent(container);

    expect(await screen.findByText('Container status')).toBeVisible();

    // Verify NameRow is rendered with the container name
    expect(screen.getByText('my-container')).toBeVisible();
  });

  test('renders the table with container information', async () => {
    const container = createMockContainer({
      Id: 'test-id-123',
      Name: '/test-container',
      State: { Running: true },
      NetworkSettings: { IPAddress: '172.17.0.5' },
    });

    renderComponent(container);

    expect(await screen.findByText('Container status')).toBeVisible();

    // Verify the table renders all key container information
    const table = screen.getByTestId('container-status-table');
    expect(table).toBeVisible();

    // Check key fields are rendered
    expect(screen.getByText('test-id-123')).toBeVisible();
    expect(screen.getByText('test-container')).toBeVisible();
    expect(screen.getByText('172.17.0.5')).toBeVisible();
  });
});

function renderComponent(container: ContainerDetailsViewModel) {
  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(ContainerStatusSection, createMockUser()), {
      route: 'docker.containers.container',
      stateConfig: [
        {
          name: 'docker.containers.container',
          url: '/docker/:endpointId/containers/:id',
          params: { endpointId: '1', id: 'container-123' },
        },
      ],
    })
  );

  return render(
    <Wrapped
      environmentId={1}
      container={container}
      nodeName="node-1"
      onSuccessUpdate={() => {}}
    />
  );
}

function createMockContainer(
  overrides: Partial<ContainerDetailsViewModel> = {}
): ContainerDetailsViewModel {
  return {
    Id: 'container-123',
    Name: '/test-container',
    Created: '2024-01-01T10:00:00Z',
    State: {
      Running: true,
      Paused: false,
      Restarting: false,
      Status: 'running',
      StartedAt: '2024-01-01T10:00:00Z',
      FinishedAt: '',
      ExitCode: 0,
    },
    NetworkSettings: {
      IPAddress: '172.17.0.2',
    },
    Config: {
      Image: 'nginx:latest',
      Labels: {},
    },
    HostConfig: {
      AutoRemove: false,
    },
    ...overrides,
  } as ContainerDetailsViewModel;
}
